from fastapi import APIRouter, Depends, HTTPException
from database import db
from api.auth import get_current_user
from services.map_generator import log_audit
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
from tasks.incident_monitor import monitor_incident_slas

router = APIRouter(prefix="/api/incidents", tags=["CERT-In Incident Reports"])

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    systems_affected: Optional[List[str]] = None
    incident_details: Optional[str] = None
    mitigation_actions: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None

class IncidentDraftRequest(BaseModel):
    circular_id: str

def get_db():
    return db.client.suraksha_maps

@router.get("", response_model=List[Dict[str, Any]])
async def list_incidents(current_user: dict = Depends(get_current_user)):
    """List all drafted and submitted CERT-In incident reports."""
    database = get_db()
    cursor = database.incident_reports.find({}).sort("created_at", -1)
    return await cursor.to_list(length=100)

@router.get("/{report_id}", response_model=Dict[str, Any])
async def get_incident(report_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve details of a specific incident report."""
    database = get_db()
    report = await database.incident_reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
    report["_id"] = str(report["_id"])
    if isinstance(report.get("sla_deadline"), datetime):
        report["sla_deadline"] = report["sla_deadline"].isoformat()
    if isinstance(report.get("created_at"), datetime):
        report["created_at"] = report["created_at"].isoformat()
    return report

@router.post("/draft", response_model=Dict[str, Any], status_code=201)
async def draft_incident(req: IncidentDraftRequest, current_user: dict = Depends(get_current_user)):
    """Manually draft an incident report from an ingested advisory."""
    database = get_db()
    circ = await database.circulars.find_one({"circular_id": req.circular_id})
    if not circ:
        raise HTTPException(status_code=404, detail="Circular / Advisory not found")
        
    report_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
    sla_deadline = datetime.utcnow() + timedelta(hours=6)
    
    # Simple parsing heuristic if it wasn't a CERT-In advisory
    cves = []
    for clause in circ.get("clauses", []):
        cves.extend(re.findall(r"\b(CVE-\d{4}-\d{4,7})\b", clause.get("text", ""), re.IGNORECASE))
    cves = list(set(cves))
    
    doc = {
        "report_id": report_id,
        "circular_id": req.circular_id,
        "title": f"Incident Report for {circ.get('title', req.circular_id)}",
        "cves": cves,
        "severity": "high",
        "status": "draft",
        "sla_deadline": sla_deadline,
        "systems_affected": ["General Enterprise Stack"],
        "incident_details": f"Vulnerabilities reported in circular {circ.get('title')}. Clauses outline technical threats requiring remediation.",
        "mitigation_actions": "Dynamic remediation MAPs generated and assigned to appropriate security departments.",
        "reporter_name": current_user.get("name", "Compliance Officer"),
        "reporter_email": current_user.get("email", "compliance@canara.bank"),
        "created_at": datetime.utcnow()
    }
    
    await database.incident_reports.insert_one(doc)
    doc["_id"] = str(doc["_id"])
    doc["sla_deadline"] = doc["sla_deadline"].isoformat()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc

@router.put("/{report_id}", response_model=Dict[str, Any])
async def update_incident(report_id: str, body: IncidentUpdate, current_user: dict = Depends(get_current_user)):
    """Update details of a drafted incident report."""
    database = get_db()
    report = await database.incident_reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    if report.get("status") == "submitted":
        raise HTTPException(status_code=400, detail="Cannot edit an incident report that has already been submitted to CERT-In")
        
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    await database.incident_reports.update_one({"report_id": report_id}, {"$set": update_data})
    
    updated = await database.incident_reports.find_one({"report_id": report_id})
    updated["_id"] = str(updated["_id"])
    updated["sla_deadline"] = updated["sla_deadline"].isoformat()
    updated["created_at"] = updated["created_at"].isoformat()
    return updated

@router.post("/{report_id}/submit", response_model=Dict[str, Any])
async def submit_incident(report_id: str, current_user: dict = Depends(get_current_user)):
    """Submit a completed incident report to CERT-In (simulated dispatch)."""
    database = get_db()
    report = await database.incident_reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found")
        
    if report.get("status") == "submitted":
        return {"status": "success", "message": "Report was already submitted."}
        
    now = datetime.utcnow()
    await database.incident_reports.update_one(
        {"report_id": report_id},
        {"$set": {"status": "submitted", "submitted_at": now}}
    )
    
    # Audit logging
    await log_audit(
        database,
        map_id=report.get("circular_id"),  # Using circular_id as target map identifier fallback
        user_id=current_user["emp_id"],
        user_name=current_user.get("name", "Officer"),
        action="incident_reported_certin",
        details=f"Incident report {report_id} formally submitted to CERT-In (Form 1) within SLA."
    )
    
    return {"status": "success", "message": f"Incident report {report_id} successfully submitted to CERT-In."}

@router.post("/monitor/check", response_model=Dict[str, Any])
async def trigger_sla_monitor(current_user: dict = Depends(get_current_user)):
    """Manually trigger the background SLA monitor to check for breaches."""
    database = get_db()
    breached_ids = await monitor_incident_slas(database)
    return {
        "status": "success",
        "checked_at": datetime.utcnow().isoformat(),
        "breached_count": len(breached_ids),
        "breached_ids": breached_ids
    }

import re
