import logging
import uuid
from datetime import datetime
from typing import Any, List
from services.map_generator import log_audit
from services.notification import send_notification

logger = logging.getLogger(__name__)

async def monitor_incident_slas(database: Any) -> List[str]:
    """
    Scans all incident reports in 'draft' state, check if they have breached 
    their 6-hour CERT-In filing deadline, and escalates/flags breaches.
    """
    logger.info("Scanning for incident SLA breaches...")
    breached_reports = []
    
    # Find draft reports whose SLA deadline has passed
    now = datetime.utcnow()
    cursor = database.incident_reports.find({
        "status": "draft",
        "sla_deadline": {"$lt": now}
    })
    
    expired_drafts = await cursor.to_list(length=100)
    for draft in expired_drafts:
        report_id = draft["report_id"]
        logger.warning(f"SLA Breach detected for incident report: {report_id}")
        
        # Update incident status to breached
        await database.incident_reports.update_one(
            {"report_id": report_id},
            {"$set": {"status": "sla_breached", "breached_at": now}}
        )
        
        # Log to audit trail
        await log_audit(
            database=database,
            map_id=draft.get("circular_id"),
            user_id="system",
            user_name="SLA Monitor Task",
            action="incident_sla_breached",
            details=f"Incident report {report_id} failed to file to CERT-In within 6 hours of advisory ingestion."
        )
        
        # Register a Compliance Anomaly
        anomaly_id = f"ANM-{uuid.uuid4().hex[:8].upper()}"
        await database.compliance_anomalies.insert_one({
            "anomaly_id": anomaly_id,
            "type": "incident_sla_breach",
            "severity": "critical",
            "details": f"Incident report {report_id} breached 6-hour CERT-In filing SLA. Advisory: {draft.get('title')}",
            "timestamp": now,
            "resolved": False
        })
        
        # Send CISO notification
        await send_notification(
            user_id="EMP-INFOSEC-001",  # CISO Priya Nair
            subject="CRITICAL SLA BREACH: Incident Reporting Deadline Missed",
            message=f"Incident report {report_id} has exceeded the 6-hour CERT-In filing SLA. Urgent filing required."
        )
        
        breached_reports.append(report_id)
        
    return breached_reports
