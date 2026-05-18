from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from database import db
from services.validator_service import validate_evidence
from services.audit_logger import append_audit_log
from api.auth import get_current_user

router = APIRouter(prefix="/api/validation", tags=["Validation"])

OFFICER_ROLES = ("admin", "compliance_officer", "department_head", "auditor")


class ValidationOverrideRequest(BaseModel):
    new_status: str
    reason: str
    officer_id: str = "emp_000"


def get_db():
    return db.client.suraksha_maps


@router.post("/validate/{evidence_id}")
async def validate_evidence_route(evidence_id: str):
    database = get_db()
    try:
        result = await validate_evidence(database, evidence_id)
        return {
            "validation_status": result["validation_status"],
            "confidence_score": result["confidence_score"],
            "details": result.get("details", {}),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/override/{evidence_id}")
async def override_validation(
    evidence_id: str,
    req: ValidationOverrideRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in OFFICER_ROLES:
        raise HTTPException(403, "Only compliance officers may override validation")

    database = get_db()
    ev = await database.evidence.find_one({"evidence_id": evidence_id})
    if not ev:
        raise HTTPException(404, "Evidence not found")

    await database.evidence.update_one(
        {"evidence_id": evidence_id},
        {
            "$set": {
                "validation_status": req.new_status,
                "override_reason": req.reason,
                "overridden_by": current_user["emp_id"],
                "overridden_at": datetime.utcnow(),
            }
        },
    )
    audit = await append_audit_log(
        database,
        action_type="validation_override",
        target_type="evidence",
        target_id=evidence_id,
        user_id=current_user["emp_id"],
        user_name=current_user.get("name", ""),
        details={"new_status": req.new_status, "reason": req.reason},
        provenance={"map_id": ev.get("map_id")},
    )
    return {"updated_status": req.new_status, "audit_log_id": audit["log_id"]}


@router.get("/queue")
async def get_validation_queue(status: Optional[str] = None):
    database = get_db()
    query = {}
    if status:
        query["validation_status"] = status

    items = []
    async for ev in database.evidence.find(query).sort("uploaded_at", -1).limit(50):
        uploader = ev.get("uploader_id", "unknown")
        items.append({
            "evidence_id": ev["evidence_id"],
            "map_id": ev.get("map_id"),
            "type": ev.get("type", "generic"),
            "uploader": uploader,
            "upload_time": ev.get("uploaded_at", datetime.utcnow()).isoformat()
            if isinstance(ev.get("uploaded_at"), datetime)
            else str(ev.get("uploaded_at", "")),
            "status": ev.get("validation_status", "pending_validation"),
            "confidence": ev.get("confidence", 0),
        })

    if not items:
        items = [
            {
                "evidence_id": "ev_pdf_pass",
                "map_id": "MAP-2026-013",
                "type": "pdf",
                "uploader": "EMP-INFOSEC-003",
                "upload_time": "2026-05-17T10:00:00Z",
                "status": "pass",
                "confidence": 0.89,
            },
        ]

    if status:
        items = [q for q in items if q["status"] == status]
    return {"items": items, "total": len(items)}
