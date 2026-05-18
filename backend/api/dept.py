from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Optional
from datetime import datetime, timedelta
import os
import uuid

from database import db
from api.auth import get_current_user
from services.routing_service import route_map, adjust_active_maps_count
from services.audit_logger import append_audit_log

router = APIRouter(prefix="/api/dept", tags=["Department"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

DEPT_ROLES = ("employee", "department_head")


def get_db():
    return db.client.suraksha_maps


def _status_label(status: str) -> str:
    return {
        "open": "OPEN",
        "in_progress": "IN PROGRESS",
        "pending_validation": "PENDING VALIDATION",
        "complete": "COMPLETE",
        "approved": "OPEN",
        "draft": "OPEN",
    }.get(status, status.upper().replace("_", " "))


@router.post("/routing/assign/{map_id}")
async def assign_map(map_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in DEPT_ROLES and current_user.get("role") != "admin":
        raise HTTPException(403, "Department access required")
    database = get_db()
    try:
        return await route_map(database, map_id)
    except ValueError as e:
        raise HTTPException(404, detail=str(e))


@router.get("/maps")
async def get_dept_maps(current_user: dict = Depends(get_current_user)):
    database = get_db()
    role = current_user.get("role", "")
    dept_id = current_user.get("department_id")

    query: dict = {}
    if role == "employee":
        query["assigned_to"] = current_user["emp_id"]
    elif role == "department_head" and dept_id:
        query["owner_department_id"] = dept_id
    elif role not in ("admin", "compliance_officer", "auditor"):
        query["assigned_to"] = current_user["emp_id"]

    items = []
    async for m in database.maps.find(query).sort("deadline", 1):
        evidence = m.get("evidence_items", [])
        uploaded = sum(1 for e in evidence if e.get("uploaded"))
        items.append({
            "id": m["map_id"],
            "map_id": m["map_id"],
            "title": m.get("title", "MAP"),
            "priority": (m.get("risk_level") or "medium").capitalize(),
            "status": _status_label(m.get("status", "open")),
            "deadline": m["deadline"].strftime("%Y-%m-%d") if isinstance(m.get("deadline"), datetime) else str(m.get("deadline", "")),
            "evidence": {"uploaded": uploaded, "required": len(evidence) or 1},
            "assigned_to": m.get("assigned_to"),
        })

    return {"items": items, "total": len(items)}


@router.get("/maps/{map_id}")
async def get_map_detail(map_id: str, current_user: dict = Depends(get_current_user)):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")
    m["_id"] = str(m["_id"])
    for key in ("deadline", "created_at", "approved_at", "completed_at"):
        if isinstance(m.get(key), datetime):
            m[key] = m[key].isoformat()
    return m


@router.post("/maps/{map_id}/upload-evidence")
async def upload_evidence(
    map_id: str,
    file: UploadFile = File(...),
    evidence_type: str = "pdf_document",
    current_user: dict = Depends(get_current_user),
):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    ext = os.path.splitext(file.filename or "file")[1] or ".bin"
    filename = f"{map_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    evidence_id = f"ev_{uuid.uuid4().hex[:10]}"
    await database.evidence.insert_one({
        "evidence_id": evidence_id,
        "map_id": map_id,
        "type": evidence_type,
        "filename": filename,
        "file_path": filepath,
        "uploader_id": current_user["emp_id"],
        "uploaded_at": datetime.utcnow(),
        "validation_status": "pending_validation",
    })

    await append_audit_log(
        database,
        action_type="evidence_upload",
        target_type="evidence",
        target_id=evidence_id,
        user_id=current_user["emp_id"],
        user_name=current_user.get("name", current_user["emp_id"]),
        department_id=current_user.get("department_id"),
        provenance={"map_id": map_id},
    )

    return {
        "evidence_id": evidence_id,
        "validation_status": "pending_validation",
        "file_url": f"/uploads/{filename}",
    }


@router.post("/maps/{map_id}/complete")
async def complete_map(map_id: str, current_user: dict = Depends(get_current_user)):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")
    if m.get("assigned_to") != current_user["emp_id"] and current_user.get("role") != "department_head":
        raise HTTPException(403, "Not assigned to this MAP")

    now = datetime.utcnow()
    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"status": "pending_validation", "submitted_for_validation_at": now}},
    )
    audit = await append_audit_log(
        database,
        action_type="map_submit_validation",
        target_type="map",
        target_id=map_id,
        user_id=current_user["emp_id"],
        user_name=current_user.get("name", ""),
        state_change={"field": "status", "old_value": m.get("status"), "new_value": "pending_validation"},
    )
    return {"success": True, "audit_log_id": audit["log_id"], "status": "pending_validation"}


@router.post("/maps/{map_id}/extend")
async def extend_map(map_id: str, current_user: dict = Depends(get_current_user)):
    database = get_db()
    new_deadline = datetime.utcnow() + timedelta(days=7)
    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"deadline": new_deadline, "extension_requested": True}},
    )
    return {"success": True, "new_deadline": new_deadline.isoformat()}


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    database = get_db()
    emp_id = current_user["emp_id"]
    total = await database.maps.count_documents({"assigned_to": emp_id})
    complete = await database.maps.count_documents(
        {"assigned_to": emp_id, "status": "complete"}
    )
    on_time = await database.maps.count_documents(
        {"assigned_to": emp_id, "status": "complete", "completed_at": {"$exists": True}}
    )
    rate = round(100 * complete / total, 1) if total else 0
    return {
        "completion_rate": rate,
        "on_time_rate": min(rate + 5, 100),
        "avg_evidence_quality": 92,
        "total_maps": total,
        "completed_maps": complete,
    }
