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
    database = get_db()
    
    # 1. Orphaned Clauses Detection
    # Get all clauses with gaps that have no corresponding policy
    orphan_clauses_count = 0
    issues = []
    suggestions = []
    
    circ_cursor = database.circulars.find({})
    async for circ in circ_cursor:
        c_id = circ.get("circular_id")
        title = circ.get("title", c_id)
        for clause in circ.get("clauses", []):
            if clause.get("gap_status") in ("confirmed", "suspected"):
                # Check if there is a MAP linking this gap to a policy
                c_num = clause.get("clause_number")
                mapped = await database.maps.find_one({
                    "circular_id": c_id,
                    "clause_text": clause.get("text"),
                    "policy_id": {"$ne": "UNASSIGNED"}
                })
                if not mapped:
                    orphan_clauses_count += 1
                    issues.append({
                        "type": "orphan_clause",
                        "description": f"Clause {c_num} from '{title}' has no covering policy linked."
                    })
                    suggestions.append(f"Create a new compliance policy or link an existing one to cover Clause {c_num}")

    # 2. Stale Edges (e.g., MAPs or policies referencing missing departments or circulars)
    stale_edges_count = 0
    maps_cursor = database.maps.find({})
    async for m in maps_cursor:
        map_id = m.get("map_id")
        # Check if department exists
        dept_id = m.get("owner_department_id")
        dept = await database.departments.find_one({"department_id": dept_id})
        if not dept:
            stale_edges_count += 1
            issues.append({
                "type": "stale_edge",
                "description": f"MAP {map_id} links to a non-existent department: {dept_id}"
            })
            suggestions.append(f"Re-route MAP {map_id} to a valid active department")
            
        # Check if circular exists
        circ_id = m.get("circular_id")
        circular = await database.circulars.find_one({"circular_id": circ_id})
        if not circular:
            stale_edges_count += 1
            issues.append({
                "type": "stale_edge",
                "description": f"MAP {map_id} links to archived or deleted circular: {circ_id}"
            })
            suggestions.append(f"Archive MAP {map_id} as its parent circular has been removed")

    # 3. Embedding Drift Calculation
    # Compute cosine similarity between policies and their mapped circular clauses
    import math
    def get_cosine_similarity(v1, v2):
        if not v1 or not v2 or len(v1) != len(v2):
            return 1.0  # Default to no drift if embeddings are missing
        dot = sum(a * b for a, b in zip(v1, v2))
        n1 = math.sqrt(sum(a*a for a in v1))
        n2 = math.sqrt(sum(b*b for b in v2))
        return dot / (n1 * n2) if n1 > 0 and n2 > 0 else 1.0

    total_similarity = 0.0
    mapped_count = 0
    drift_issues = 0
    
    # Iterate through MAPs that link policies to circulars
    linked_maps = database.maps.find({"policy_id": {"$ne": "UNASSIGNED"}})
    async for m in linked_maps:
        circ_id = m.get("circular_id")
        pol_id = m.get("policy_id")
        
        policy = await database.policies.find_one({"policy_id": pol_id})
        circular = await database.circulars.find_one({"circular_id": circ_id})
        
        if policy and circular:
            p_emb = policy.get("embedding")
            # Find the clause in the circular
            c_text = m.get("clause_text", "")
            c_emb = None
            for c in circular.get("clauses", []):
                if c.get("text") == c_text:
                    c_emb = c.get("embedding")
                    break
            
            if p_emb and c_emb:
                similarity = get_cosine_similarity(p_emb, c_emb)
                total_similarity += similarity
                mapped_count += 1
                
                # Heuristic: similarity < 0.70 represents significant semantic drift
                if similarity < 0.70:
                    drift_issues += 1
                    issues.append({
                        "type": "embedding_drift",
                        "description": f"Policy '{policy.get('title')}' shows low alignment ({similarity:.2f}) with Clause text."
                    })
                    suggestions.append(f"Revise Policy '{policy.get('title')}' to re-align with regulatory updates.")

    avg_similarity = (total_similarity / mapped_count) if mapped_count > 0 else 0.85
    connectivity_score = int(avg_similarity * 100)
    
    # Calculate coverage rate
    total_clauses = 0
    covered_clauses = 0
    async for circ in database.circulars.find({}):
        for c in circ.get("clauses", []):
            total_clauses += 1
            if c.get("gap_status") == "covered":
                covered_clauses += 1
                
    policy_coverage_rate = int((covered_clauses / total_clauses * 100)) if total_clauses > 0 else 85
    health_score = max(30, 100 - (orphan_clauses_count * 3) - (stale_edges_count * 4) - (drift_issues * 5))

    # 4. Construct Nodes and Links for Graph Visualization
    nodes = []
    links = []
    added_nodes = set()
    
    # Fetch all departments
    dept_cursor = database.departments.find({})
    async for dept in dept_cursor:
        d_id = dept.get("department_id")
        if d_id not in added_nodes:
            nodes.append({"id": d_id, "label": dept.get("name", d_id), "group": "department"})
            added_nodes.add(d_id)
            
    # Fetch circulars & clauses
    circ_cursor = database.circulars.find({})
    async for circ in circ_cursor:
        c_id = circ.get("circular_id")
        if c_id not in added_nodes:
            nodes.append({"id": c_id, "label": circ.get("title", c_id)[:30], "group": "circular"})
            added_nodes.add(c_id)
            
        for clause in circ.get("clauses", []):
            cl_num = clause.get("clause_number") or "01"
            cl_id = f"{c_id}_{cl_num}"
            if cl_id not in added_nodes:
                nodes.append({"id": cl_id, "label": f"Clause {cl_num}", "group": "clause"})
                added_nodes.add(cl_id)
            links.append({"source": c_id, "target": cl_id, "type": "contains"})

    # Fetch policies
    policy_cursor = database.policies.find({})
    async for policy in policy_cursor:
        pol_id = policy.get("policy_id")
        if pol_id not in added_nodes:
            nodes.append({"id": pol_id, "label": policy.get("title", pol_id)[:30], "group": "policy"})
            added_nodes.add(pol_id)
        dept_owner = policy.get("department_owner_id")
        if dept_owner:
            links.append({"source": pol_id, "target": dept_owner, "type": "owned_by"})

    # Fetch MAPs
    maps_cursor = database.maps.find({})
    async for m in maps_cursor:
        map_id = m.get("map_id")
        if map_id not in added_nodes:
            nodes.append({"id": map_id, "label": m.get("title", map_id)[:30], "group": "map"})
            added_nodes.add(map_id)
            
        circ_id = m.get("circular_id")
        cl_num = None
        if circ_id:
            circular = await database.circulars.find_one({"circular_id": circ_id})
            if circular:
                for c in circular.get("clauses", []):
                    if c.get("text") == m.get("clause_text"):
                        cl_num = c.get("clause_number") or "01"
                        break
        
        if circ_id and cl_num:
            cl_id = f"{circ_id}_{cl_num}"
            links.append({"source": cl_id, "target": map_id, "type": "mapped_to"})
            
        pol_id = m.get("policy_id")
        if pol_id and pol_id != "UNASSIGNED":
            links.append({"source": map_id, "target": pol_id, "type": "remediates"})
            
        dept_id = m.get("owner_department_id")
        if dept_id:
            links.append({"source": map_id, "target": dept_id, "type": "assigned_dept"})

    return {
        "health_score": health_score,
        "stale_edges": stale_edges_count,
        "orphan_clauses": orphan_clauses_count,
        "policy_coverage_rate": policy_coverage_rate,
        "connectivity_score": connectivity_score,
        "issues": issues,
        "suggestions": suggestions,
        "graph": {
            "nodes": nodes,
            "links": links
        }
    }


@router.post("/graph-health/prune")
async def prune_graph():
    database = get_db()
    # Actually delete or clean up stale relationships
    pruned_count = 0
    maps_cursor = database.maps.find({})
    async for m in maps_cursor:
        map_id = m.get("map_id")
        circ_id = m.get("circular_id")
        circular = await database.circulars.find_one({"circular_id": circ_id})
        
        # Prune if circular was deleted
        if not circular:
            await database.maps.delete_one({"map_id": map_id})
            pruned_count += 1
            
    return {"status": "success", "message": f"Successfully pruned {pruned_count} stale edges from MAP tracking database."}



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
