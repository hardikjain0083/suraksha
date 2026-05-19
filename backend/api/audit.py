from fastapi import APIRouter, Request, Depends, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

from database import db
from services.audit_logger import append_audit_log, verify_audit_chain
from api.auth import get_current_user

router = APIRouter(prefix="/api/audit", tags=["Audit Logger"])
AUDIT_ROLES = {"admin", "compliance_officer", "auditor"}


def get_db():
    return db.client.suraksha_maps


class AuditLogRequest(BaseModel):
    action_type: str
    target_type: str
    target_id: str
    user_id: str = "sys_auto"
    user_name: str = "System Audit"
    department_id: Optional[str] = None
    session_id: Optional[str] = None
    details: Dict[str, Any] = {}
    provenance: Dict[str, Any] = {}
    state_change: Dict[str, Any] = {}


@router.post("/log")
async def create_audit_log(
    req: AuditLogRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in AUDIT_ROLES:
        raise HTTPException(403, "Audit logging access required")
    database = get_db()
    client_host = request.client.host if request.client else None
    return await append_audit_log(
        database,
        action_type=req.action_type,
        target_type=req.target_type,
        target_id=req.target_id,
        user_id=current_user["emp_id"],
        user_name=current_user.get("name", current_user["emp_id"]),
        department_id=current_user.get("department_id"),
        session_id=req.session_id,
        details=req.details,
        provenance=req.provenance,
        state_change=req.state_change,
        ip_address=client_host,
        user_agent=request.headers.get("user-agent"),
    )


@router.get("/logs")
async def get_audit_logs(limit: int = 100, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in AUDIT_ROLES:
        raise HTTPException(403, "Audit access required")
    database = get_db()
    cursor = database.audit_logs.find({}).sort("timestamp", -1).limit(limit)
    items = []
    async for log in cursor:
        log["_id"] = str(log["_id"])
        if isinstance(log.get("timestamp"), datetime):
            log["timestamp"] = log["timestamp"].isoformat()
        items.append(log)
    return {"items": items, "total": len(items)}


@router.get("/golden-thread/{map_id}")
async def get_golden_thread(map_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in AUDIT_ROLES:
        raise HTTPException(403, "Audit access required")
    database = get_db()
    map_doc = await database.maps.find_one({"map_id": map_id})
    if map_doc and map_doc.get("provenance_path"):
        nodes = []
        edges = []
        prev_id = None
        for i, node in enumerate(map_doc["provenance_path"]):
            nid = f"n{i}"
            nodes.append({
                "id": nid,
                "type": node.get("type", "unknown"),
                "label": node.get("title") or node.get("id", nid),
                "status": "linked",
            })
            if prev_id:
                edges.append({"from": prev_id, "to": nid})
            prev_id = nid
        return {"nodes": nodes, "edges": edges, "map_id": map_id}

    raise HTTPException(404, "Golden thread not found for MAP")


@router.post("/verify-chain")
async def verify_chain(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in AUDIT_ROLES:
        raise HTTPException(403, "Audit access required")
    database = get_db()
    result = await verify_audit_chain(database)
    return result
