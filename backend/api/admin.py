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
from services.map_completion import validate_required_evidence
from services.validator_service import validate_evidence

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

    now = datetime.utcnow()
    validation = await validate_required_evidence(database, m)
    update_fields = {
        "evidence_items": validation["evidence_items"],
        "submitted_for_validation_at": now,
        "last_validation_checked_at": validation["checked_at"],
    }
    if not validation["can_complete"]:
        update_fields.update({
            "status": "pending_validation",
            "validation_blockers": validation["blockers"],
            "timeline": build_timeline("pending_validation", m.get("created_at", now), now),
        })
        await database.maps.update_one({"map_id": map_id}, {"$set": update_fields})
        await log_audit(
            database, map_id,
            current_user["emp_id"], current_user.get("name", "Employee"),
            "map_validation_blocked",
            f"Completion blocked by evidence validation: {validation['blockers']}",
        )
        raise HTTPException(
            status_code=422,
            detail={
                "message": "MAP cannot be completed until required evidence passes validation or is officer-overridden.",
                "blockers": validation["blockers"],
            },
        )

    update_fields.update({
            "status": "complete",
            "completed_at": now,
            "validation_blockers": [],
            "timeline": build_timeline("complete", m.get("created_at", now), now),
    })
    await database.maps.update_one({"map_id": map_id}, {"$set": update_fields})
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Employee"),
        "map_completed",
        "Required evidence validated; MAP marked complete",
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
    evidence_id = f"ev_{uuid.uuid4().hex[:10]}"
    evidence[evidence_index]["uploaded"] = True
    evidence[evidence_index]["file_url"] = file_url
    evidence[evidence_index]["uploaded_at"] = datetime.utcnow().isoformat()
    evidence[evidence_index]["evidence_id"] = evidence_id
    evidence[evidence_index]["validation_status"] = "pending_validation"

    await database.evidence.insert_one({
        "evidence_id": evidence_id,
        "map_id": map_id,
        "evidence_index": evidence_index,
        "type": evidence[evidence_index].get("evidence_type", "generic"),
        "filename": filename,
        "original_filename": file.filename,
        "file_path": filepath,
        "file_url": file_url,
        "uploader_id": current_user["emp_id"],
        "uploaded_at": datetime.utcnow(),
        "validation_status": "pending_validation",
    })
    validation_result = await validate_evidence(database, evidence_id)
    evidence[evidence_index]["validation_status"] = validation_result["validation_status"]
    evidence[evidence_index]["confidence"] = validation_result["confidence_score"]

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
        "evidence_id": evidence_id,
        "validation_status": validation_result["validation_status"],
        "confidence_score": validation_result["confidence_score"],
        "file_url": file_url,
    }


# ─── Existing admin endpoints (preserved) ───────────────────────────────────

@router.get("/dashboard")
async def get_dashboard_stats():
    database = get_db()
    
    total_circ = await database.circulars.count_documents({})
    processed_circ = await database.circulars.count_documents({"status": "Fully Parsed"})
    failed_circ = await database.circulars.count_documents({"status": "Failed"})
    
    confirmed_gaps = await database.gaps.count_documents({"status": "confirmed"})
    suspected_gaps = await database.gaps.count_documents({"status": "suspected"})
    
    total_maps = await database.maps.count_documents({})
    complete_maps = await database.maps.count_documents({"status": "complete"})
    map_rate = round((complete_maps / total_maps * 100) if total_maps > 0 else 0)
    
    return {
        "regulatory_coverage": {"processed": processed_circ, "total": total_circ},
        "active_gaps": {"confirmed": confirmed_gaps, "suspected": suspected_gaps},
        "map_completion": {"rate": map_rate},
        "behavioral_health": {"green_sessions": 92},
        "charts": {
            "circular_status": {"parsed": processed_circ, "failed": failed_circ, "pending": total_circ - processed_circ - failed_circ},
            "map_status": {"overall": {"done": complete_maps, "pending": total_maps - complete_maps}},
            "gap_trend": [{"date": "2026-05-01", "count": 5}, {"date": "2026-05-15", "count": 12}],
            "dept_workload": {"it": 12, "compliance": 6, "hr": 3},
        },
        "alerts": [
            {"type": "info", "message": "Dashboard stats are now live from DB!"},
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
