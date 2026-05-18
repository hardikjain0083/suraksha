import os
import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from database import db
from api.auth import get_current_user
from services.map_generator import log_audit, build_timeline

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_db() -> AsyncIOMotorDatabase:
    return db.client.suraksha_maps


# ─── Role guard helpers ──────────────────────────────────────────────────────

ADMIN_ROLES = {"admin", "compliance_officer", "department_head"}


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin/Compliance Officer access required",
        )
    return current_user


# ─── Pydantic bodies ─────────────────────────────────────────────────────────

class AssignBody(BaseModel):
    emp_id: str
    emp_name: Optional[str] = None


class CompleteBody(BaseModel):
    emp_id: str


class RoleUpdateBody(BaseModel):
    role: str


# ─── Admin: list users (with optional role filter & real DB) ─────────────────

@router.get("/users")
async def get_users(role: Optional[str] = None, _=Depends(require_admin)):
    database = get_db()
    query: dict = {}
    if role:
        query["role"] = role
    cursor = database.users.find(query, {"hashed_password": 0, "_id": 0})
    users = []
    async for u in cursor:
        assigned_count = await database.maps.count_documents({"assigned_to": u.get("emp_id")})
        users.append({
            "id": u.get("emp_id"),
            "emp_id": u.get("emp_id"),
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "dept": u.get("department_id", ""),
            "role": u.get("role", "employee"),
            "designation": u.get("designation", ""),
            "baseline_status": u.get("behavioral_baseline", {}).get("status", "pending").title(),
            "accessibility_flag": u.get("accessibility_flag", False),
            "assigned_maps": assigned_count,
            "status": u.get("status", "active"),
        })
    return users


@router.post("/users/{user_id}/reset-enrollment")
async def reset_enrollment(user_id: str, _=Depends(require_admin)):
    database = get_db()
    result = await database.users.update_one(
        {"emp_id": user_id},
        {"$set": {
            "behavioral_baseline.status": "pending",
            "behavioral_baseline.rounds_completed": 0,
            "behavioral_baseline.raw_data": [],
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(404, f"User {user_id} not found")
    return {"status": "success", "message": f"Enrollment reset for {user_id}"}


@router.patch("/users/{emp_id}/role")
async def update_user_role(emp_id: str, body: RoleUpdateBody, _=Depends(require_admin)):
    """Change a user's role (admin only)."""
    VALID_ROLES = {"admin", "compliance_officer", "department_head", "auditor", "employee"}
    if body.role not in VALID_ROLES:
        raise HTTPException(400, f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")
    database = get_db()
    result = await database.users.update_one(
        {"emp_id": emp_id},
        {"$set": {"role": body.role}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, f"User {emp_id} not found")
    return {"status": "success", "emp_id": emp_id, "new_role": body.role}


# ─── Map: assign to employee ─────────────────────────────────────────────────

@router.patch("/maps/{map_id}/assign")
async def assign_map(
    map_id: str,
    body: AssignBody,
    current_user: dict = Depends(require_admin),
):
    """Assign a MAP to an employee (admin/compliance officer only)."""
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    # Resolve name if not provided
    name = body.emp_name
    if not name:
        u = await database.users.find_one({"emp_id": body.emp_id})
        name = u.get("name", body.emp_id) if u else body.emp_id

    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {
            "assigned_to": body.emp_id,
            "assignee_name": name,
            "status": "in_progress",
        }},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Officer"),
        "map_assigned",
        f"MAP assigned to {name} ({body.emp_id})",
    )
    return {"status": "assigned", "map_id": map_id, "assigned_to": body.emp_id, "assignee_name": name}


# ─── Map: mark complete ───────────────────────────────────────────────────────

@router.patch("/maps/{map_id}/complete")
async def complete_map(
    map_id: str,
    body: CompleteBody,
    current_user: dict = Depends(get_current_user),
):
    """Employee marks their MAP task as complete."""
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    # Only the assigned employee or admins may complete
    role = current_user.get("role", "")
    if role not in ADMIN_ROLES and m.get("assigned_to") != current_user["emp_id"]:
        raise HTTPException(403, "You are not assigned to this MAP")

    # Check all required evidence is uploaded
    evidence = m.get("evidence_items", [])
    missing = [e["label"] for e in evidence if e.get("required") and not e.get("uploaded")]
    if missing:
        raise HTTPException(
            400,
            f"Upload required evidence first: {', '.join(missing)}",
        )

    now = datetime.utcnow()
    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {
            "status": "complete",
            "completed_at": now,
            "timeline": build_timeline("complete", m.get("created_at", now), now),
        }},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Employee"),
        "map_completed",
        "Task marked as complete by assigned employee",
    )
    return {"status": "complete", "map_id": map_id}


# ─── Map: upload evidence file ────────────────────────────────────────────────

@router.post("/maps/{map_id}/evidence/{evidence_index}")
async def upload_evidence(
    map_id: str,
    evidence_index: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a proof file for a specific evidence item."""
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    role = current_user.get("role", "")
    if role not in ADMIN_ROLES and m.get("assigned_to") != current_user["emp_id"]:
        raise HTTPException(403, "You are not assigned to this MAP")

    evidence = m.get("evidence_items", [])
    if evidence_index < 0 or evidence_index >= len(evidence):
        raise HTTPException(400, f"Invalid evidence index {evidence_index}")

    # Save file
    ext = os.path.splitext(file.filename or "proof")[1] or ".bin"
    filename = f"{map_id}_ev{evidence_index}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(filepath, "wb") as f_out:
        f_out.write(contents)

    file_url = f"/uploads/{filename}"

    # Update the specific evidence item
    evidence[evidence_index]["uploaded"] = True
    evidence[evidence_index]["file_url"] = file_url
    evidence[evidence_index]["uploaded_at"] = datetime.utcnow().isoformat()

    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"evidence_items": evidence}},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Employee"),
        "evidence_uploaded",
        f"Uploaded proof for evidence item {evidence_index}: {file.filename}",
    )
    return {
        "status": "uploaded",
        "map_id": map_id,
        "evidence_index": evidence_index,
        "file_url": file_url,
    }


# ─── Existing admin endpoints (preserved) ───────────────────────────────────

@router.get("/dashboard")
async def get_dashboard_stats():
    return {
        "regulatory_coverage": {"processed": 45, "total": 50},
        "active_gaps": {"confirmed": 12, "suspected": 8},
        "map_completion": {"rate": 85},
        "behavioral_health": {"green_sessions": 92},
        "charts": {
            "circular_status": {"parsed": 45, "failed": 2, "pending": 3},
            "map_status": {"it": {"done": 10, "pending": 2}, "compliance": {"done": 5, "pending": 1}},
            "gap_trend": [{"date": "2026-05-01", "count": 5}, {"date": "2026-05-15", "count": 12}],
            "dept_workload": {"it": 12, "compliance": 6, "hr": 3},
        },
        "alerts": [
            {"type": "error", "message": "Failed to parse RBI/2026-XYZ"},
            {"type": "warning", "message": "MAP-2026-015 is overdue"},
            {"type": "info", "message": "Behavioral anomaly detected for user IT-44"},
        ],
    }


@router.get("/graph-health")
async def get_graph_health():
    return {
        "health_score": 82, "stale_edges": 5, "orphan_clauses": 12,
        "policy_coverage_rate": 78, "connectivity_score": 85,
        "issues": [
            {"type": "stale_edge", "description": "Policy pol_3 links to archived circular RBI/2023-01"},
            {"type": "orphan_clause", "description": "Clause 4.1 from RBI/2026-ABC has no covering policy"},
        ],
        "suggestions": ["Update pol_3 to reference RBI/2026-ABC", "Create new policy for Clause 4.1"],
    }


@router.post("/graph-health/prune")
async def prune_graph():
    return {"status": "success", "message": "Pruned 5 stale edges. Logged to audit."}


@router.post("/ingestion/reparse/{circular_id:path}")
async def reparse_circular(circular_id: str, settings: dict = None):
    return {"status": "success", "message": f"Triggered re-parse for {circular_id}"}


@router.get("/ux-metrics")
async def get_ux_metrics():
    return {
        "avg_login_time_with": 2.5, "avg_login_time_without": 1.8,
        "interruption_rate": 4.2, "enrollment_success": 95, "re_enrollment_rate": 2.1,
        "dept_stats": [
            {"dept": "IT", "sensitivity": 70, "interruptions": 6.5},
            {"dept": "HR", "sensitivity": 50, "interruptions": 2.1},
        ],
    }


@router.post("/sensitivity/{dept_id}")
async def update_sensitivity(dept_id: str, payload: dict):
    return {"status": "success", "message": f"Updated sensitivity for {dept_id}"}
