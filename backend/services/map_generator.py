import re
import uuid
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from models.map import ProvenanceNode, EvidenceItem, AuditTrailEntry, TimelineEntry, SimilarMapRef

logger = logging.getLogger(__name__)

DEFAULT_DEADLINE_DAYS = 45

# Dynamic SLA deadlines used instead of a fixed default

CATEGORY_DEPARTMENT = {
    "cryptography": "DEPT-INFOSEC",
    "authentication": "DEPT-IT",
    "data_protection": "DEPT-INFOSEC",
    "network_security": "DEPT-INFOSEC",
    "monitoring": "DEPT-IT",
    "audit": "DEPT-COMPLIANCE",
    "compliance": "DEPT-LEGAL",
    "legal": "DEPT-LEGAL",
    "cybersecurity": "DEPT-INFOSEC",
    "default": "DEPT-COMPLIANCE",
}

EVIDENCE_BY_CATEGORY = {
    "cryptography": [
        ("config_file", "Configuration export"),
        ("screenshot", "Encryption settings screenshot"),
    ],
    "authentication": [
        ("config_file", "IAM/MFA configuration"),
        ("screenshot", "MFA enrollment dashboard"),
    ],
    "audit": [
        ("pdf_document", "Audit report PDF"),
        ("scan_report", "Vulnerability scan report"),
    ],
    "monitoring": [
        ("screenshot", "SIEM dashboard"),
        ("config_file", "Alert rule configuration"),
    ],
    "process": [
        ("pdf_document", "Signed policy document"),
        ("ticket_id", "Change management ticket"),
    ],
    "default": [
        ("pdf_document", "Compliance evidence document"),
        ("ticket_id", "Remediation ticket ID"),
    ],
}

SEVERITY_BASE = {"critical": 100, "high": 75, "medium": 50, "low": 25}
ISSUER_BOOST = {"RBI": 15, "SEBI": 10, "CERT-In": 10, "CERT-IN": 10}


def _detect_clause_category(clause_text: str) -> str:
    text = clause_text.lower()
    if any(k in text for k in ("encrypt", "aes", "tls", "cipher", "cryptograph")):
        return "cryptography"
    if any(k in text for k in ("mfa", "multi-factor", "authenticate", "password", "sso")):
        return "authentication"
    if any(k in text for k in ("audit", "log", "siem", "monitor")):
        return "audit" if "audit" in text else "monitoring"
    if any(k in text for k in ("comply", "regulation", "statutory", "legal")):
        return "compliance"
    if any(k in text for k in ("firewall", "vpn", "network", "perimeter")):
        return "network_security"
    return "default"


def generate_title_from_clause(clause_text: str) -> str:
    """Extract action verb + object → title case MAP title."""
    text = clause_text.strip()
    match = re.search(
        r"\b(shall|must|will|should)\s+(.+?)(?:\.|,|;|$)",
        text,
        re.IGNORECASE,
    )
    action = match.group(2).strip() if match else text[:120]
    action = re.sub(r"\s+", " ", action)
    if len(action) > 100:
        action = action[:97] + "..."
    return action[:1].upper() + action[1:] if action else "Remediate Compliance Gap"


def generate_description(clause_text: str, circular_title: str, policy_title: Optional[str]) -> str:
    ctx = f"Per regulatory circular '{circular_title}'"
    if policy_title:
        ctx += f", aligned against internal policy '{policy_title}'"
    return (
        f"{ctx}, the institution must ensure compliance with the following obligation: "
        f"{clause_text.strip()} "
        "Documented evidence of implementation must be submitted before the MAP deadline."
    )


def suggest_evidence_types(category: str) -> list[dict[str, str]]:
    pairs = EVIDENCE_BY_CATEGORY.get(category, EVIDENCE_BY_CATEGORY["default"])
    if category not in ("cryptography", "authentication", "audit", "monitoring"):
        pairs = EVIDENCE_BY_CATEGORY["process"]
    return [{"type": t, "label": l} for t, l in pairs]


def build_evidence_items(suggested: list[dict[str, str]]) -> list[dict]:
    return [
        {
            "evidence_type": s["type"],
            "label": s["label"],
            "required": True,
            "uploaded": False,
        }
        for s in suggested
    ]


def calculate_priority_score(
    severity: str,
    deadline: datetime,
    issuer: Optional[str],
) -> int:
    base = SEVERITY_BASE.get((severity or "medium").lower(), 50)
    days_left = (deadline - datetime.utcnow()).days
    if days_left < 7:
        base += 20
    elif days_left < 14:
        base += 10
    if issuer:
        base += ISSUER_BOOST.get(issuer.upper(), ISSUER_BOOST.get(issuer, 0))
    return min(100, base)


def severity_to_risk(severity: Optional[str], gap_status: str) -> str:
    if severity:
        return severity.lower() if severity.lower() in SEVERITY_BASE else "medium"
    if gap_status == "confirmed":
        return "high"
    if gap_status == "suspected":
        return "medium"
    return "low"


async def resolve_department_graph_lookup(
    database: Any,
    gap: dict,
    policy_id: Optional[str],
    category: str,
) -> tuple[str, str]:
    """
    MongoDB aggregation: gap → policy → department (with $graphLookup on dept hierarchy).
    """
    dept_name = "Compliance"
    dept_id = CATEGORY_DEPARTMENT.get(category, CATEGORY_DEPARTMENT["default"])

    if policy_id:
        pipeline = [
            {"$match": {"policy_id": policy_id}},
            {
                "$lookup": {
                    "from": "departments",
                    "localField": "department_owner_id",
                    "foreignField": "department_id",
                    "as": "dept",
                }
            },
            {"$unwind": {"path": "$dept", "preserveNullAndEmptyArrays": True}},
            {
                "$graphLookup": {
                    "from": "departments",
                    "startWith": "$dept.parent_department_id",
                    "connectFromField": "parent_department_id",
                    "connectToField": "department_id",
                    "as": "dept_chain",
                    "maxDepth": 2,
                }
            },
            {
                "$project": {
                    "department_owner_id": 1,
                    "dept_name": "$dept.name",
                    "dept_id": "$dept.department_id",
                }
            },
        ]
        async for row in database.policies.aggregate(pipeline):
            if row.get("department_owner_id"):
                dept_id = row["department_owner_id"]
            if row.get("dept_name"):
                dept_name = row["dept_name"]
            elif row.get("dept_id"):
                dept_id = row["dept_id"]
            break
    else:
        dept = await database.departments.find_one({"department_id": dept_id})
        if dept:
            dept_name = dept.get("name", dept_name)

    return dept_id, dept_name


async def find_similar_historical_maps(
    database: Any,
    clause_text: str,
    limit: int = 5,
) -> tuple[list[SimilarMapRef], int]:
    """Count and fetch resolved MAPs with similar clause obligations."""
    keywords = [w.lower() for w in re.findall(r"\b[A-Za-z]{5,}\b", clause_text)[:8]]
    if not keywords:
        return [], 0

    regex = "|".join(re.escape(k) for k in keywords[:5])
    query = {
        "status": {"$in": ["complete", "published", "approved", "open", "in_progress"]},
        "$or": [
            {"clause_text": {"$regex": regex, "$options": "i"}},
            {"description": {"$regex": regex, "$options": "i"}},
            {"title": {"$regex": regex, "$options": "i"}},
        ],
    }
    count = await database.maps.count_documents(query)
    cursor = database.maps.find(query).sort("created_at", -1).limit(limit)
    refs = []
    async for m in cursor:
        refs.append(
            SimilarMapRef(
                map_id=m["map_id"],
                title=m.get("title", m.get("action_plan", "MAP")[:80]),
                status=m.get("status", "complete"),
                resolved_at=m.get("completed_at") or m.get("approved_at"),
            )
        )
    return refs, count


async def get_circular_context(database: Any, circular_id: str, clause_number: Optional[str]) -> dict:
    circular = await database.circulars.find_one({"circular_id": circular_id})
    if not circular:
        return {"title": circular_id, "issuer": "UNKNOWN", "clause_text": "", "clause_id": clause_number or ""}

    clause_text = ""
    clause_id = clause_number or ""
    for c in circular.get("clauses", []):
        cn = c.get("clause_number") or c.get("clause_id", "")
        if clause_number and str(cn) == str(clause_number):
            clause_text = c.get("text", "")
            clause_id = str(cn)
            break
    if not clause_text and circular.get("clauses"):
        clause_text = circular["clauses"][0].get("text", "")
        clause_id = circular["clauses"][0].get("clause_number") or circular["clauses"][0].get("clause_id", "")

    return {
        "title": circular.get("title", circular_id),
        "issuer": circular.get("issuer", "UNKNOWN"),
        "clause_text": clause_text,
        "clause_id": clause_id,
    }


def build_provenance_path(
    circular_id: str,
    circular_title: str,
    clause_id: str,
    clause_text: str,
    gap_id: str,
    gap_classification: str,
    policy_id: Optional[str],
    policy_title: Optional[str],
    dept_id: str,
    dept_name: str,
) -> list[dict]:
    return [
        {"type": "circular", "id": circular_id, "title": circular_title},
        {"type": "clause", "id": clause_id, "text": clause_text[:500]},
        {"type": "gap", "id": gap_id, "classification": gap_classification},
        {"type": "policy", "id": policy_id or "none", "title": policy_title},
        {"type": "department", "id": dept_id, "name": dept_name},
    ]


def build_timeline(status: str, created_at: datetime, approved_at: Optional[datetime] = None) -> list[dict]:
    stages = [
        ("created", "Created", True),
        ("approved", "Approved", status not in ("draft", "rejected")),
        ("open", "Open", status in ("open", "in_progress", "complete", "published", "approved")),
        ("in_progress", "In Progress", status in ("in_progress", "complete", "published")),
        ("complete", "Complete", status in ("complete", "published")),
    ]
    timeline = []
    for key, label, done in stages:
        ts = created_at if key == "created" else approved_at if key == "approved" and approved_at else None
        timeline.append({"stage": key, "label": label, "timestamp": ts, "completed": done})
    return timeline


async def generate_map_from_gap(
    database: Any,
    gap_id: str,
    officer_id: str = "system",
    officer_name: str = "Compliance Officer",
) -> dict:
    gap = await database.gap_queue.find_one({"gap_id": gap_id})
    if not gap:
        raise ValueError(f"Gap not found: {gap_id}")

    existing = await database.maps.find_one({"gap_id": gap_id, "status": {"$ne": "rejected"}})
    if existing:
        return existing

    circular_ctx = await get_circular_context(
        database, gap["circular_id"], gap.get("clause_number")
    )
    clause_text = gap.get("clause_text") or circular_ctx["clause_text"]
    category = _detect_clause_category(clause_text)
    policy_id = gap.get("top_policy_id")
    policy_title = gap.get("top_policy_title")

    dept_id, dept_name = await resolve_department_graph_lookup(
        database, gap, policy_id, category
    )

    title = generate_title_from_clause(clause_text)
    description = generate_description(clause_text, circular_ctx["title"], policy_title)
    
    # SLA-driven dynamic deadlines
    sev_lower = (gap.get("severity") or "medium").lower()
    is_certin = circular_ctx.get("issuer") == "CERT-In"
    map_type = "security" if (is_certin or category in ("cryptography", "authentication", "network_security", "cybersecurity") or sev_lower in ("critical", "high")) else "operational"
    
    if sev_lower == "critical":
        sla_days = 3
    elif sev_lower == "high":
        sla_days = 7
    elif sev_lower == "medium":
        sla_days = 15
    else:
        sla_days = 30
        
    deadline = datetime.utcnow() + timedelta(days=sla_days)
    suggested = suggest_evidence_types(category)
    evidence_items = build_evidence_items(suggested)

    similar_refs, hist_count = await find_similar_historical_maps(database, clause_text)
    if gap.get("historical_match_count") is not None:
        hist_count = max(hist_count, gap["historical_match_count"])

    is_historical = gap.get("routing") == "auto_routed" or hist_count >= 3
    confidence = min(0.99, 0.5 + (hist_count * 0.1) + (gap.get("similarity_score") or 0) * 0.3)
    risk = severity_to_risk(gap.get("severity"), gap.get("gap_status", "confirmed"))
    priority = calculate_priority_score(
        gap.get("severity", "medium"), deadline, circular_ctx.get("issuer")
    )

    provenance = build_provenance_path(
        gap["circular_id"],
        circular_ctx["title"],
        str(gap.get("clause_number") or circular_ctx["clause_id"]),
        clause_text,
        gap_id,
        gap.get("gap_status", "confirmed"),
        policy_id,
        policy_title,
        dept_id,
        dept_name,
    )

    # CISO Escalation Check
    ciso_escalated = False
    escalation_reason = None
    
    if map_type == "security" and sev_lower in ("critical", "high"):
        # Extract CVEs from clause text
        cves = re.findall(r"\b(CVE-\d{4}-\d{4,7})\b", clause_text, re.IGNORECASE)
        from services.threat_mapper import correlate_advisory_to_assets
        correlated = await correlate_advisory_to_assets(
            database=database,
            cves=cves,
            systems_affected=[category],
            full_text=clause_text
        )
        # If any correlated asset has critical sensitivity or sensitive customer data category, escalate
        for asset in correlated:
            if asset.get("sensitivity") == "critical" or asset.get("category") == "sensitive_customer_data":
                ciso_escalated = True
                escalation_reason = f"Critical threat affecting sensitive asset: {asset.get('name')} ({asset.get('asset_id')})"
                break

    status = "escalated" if ciso_escalated else ("approved" if is_historical else "draft")
    map_id = f"MAP-{uuid.uuid4().hex[:8].upper()}"

    requirements = [
        f"Implement controls per clause {gap.get('clause_number', 'N/A')}",
        "Submit all required evidence types before deadline",
        f"Coordinate with {dept_name} for sign-off",
    ]

    now = datetime.utcnow()
    map_doc = {
        "map_id": map_id,
        "gap_id": gap_id,
        "circular_id": gap["circular_id"],
        "policy_id": policy_id or "UNASSIGNED",
        "title": title,
        "description": description,
        "requirements": requirements,
        "status": status,
        "owner_department_id": dept_id,
        "department_name": dept_name,
        "assigned_to": None,
        "deadline": deadline,
        "priority_score": priority,
        "risk_level": risk,
        "provenance_path": provenance,
        "evidence_items": evidence_items,
        "clause_text": clause_text,
        "historical_match_count": hist_count,
        "confidence_score": round(confidence, 2),
        "is_historical_match": is_historical,
        "similar_past_maps": [r.model_dump() for r in similar_refs],
        "map_type": map_type,
        "ciso_escalated": ciso_escalated,
        "escalation_reason": escalation_reason,
        "audit_trail": [
            {
                "timestamp": now,
                "user_id": officer_id,
                "user_name": officer_name,
                "action": "map_generated",
                "details": f"Generated from gap {gap_id} ({'auto-routed' if is_historical else 'pending review'})",
            }
        ],
        "timeline": build_timeline(status, now, now if status == "approved" else None),
        "issuer": circular_ctx.get("issuer"),
        "created_at": now,
        "approved_at": now if status == "approved" else None,
        "routing_source": gap.get("routing", "pending_review"),
    }

    await database.maps.insert_one(map_doc)

    if ciso_escalated:
        from services.notification import send_notification
        await send_notification(
            user_id="EMP-INFOSEC-001",
            subject="CRITICAL ESCALATION: Sensitive System Exposed",
            message=f"Critical threat affecting sensitive customer-data system has been escalated. MAP ID: {map_id}. Reason: {escalation_reason}"
        )

    await database.gap_queue.update_one(
        {"gap_id": gap_id},
        {"$set": {"generated_map_id": map_id, "triage_status": "assigned"}},
    )

    await database.triage_actions.insert_one({
        "action_id": f"ACT-{uuid.uuid4().hex[:8].upper()}",
        "map_id": map_id,
        "gap_id": gap_id,
        "timestamp": now,
        "officer_id": officer_id,
        "officer_name": officer_name,
        "decision": "escalated" if ciso_escalated else "generated",
        "title": title,
    })

    return map_doc


async def log_audit(database: Any, map_id: str, user_id: str, user_name: str, action: str, details: str = ""):
    from services.audit_logger import append_audit_log

    entry = {
        "timestamp": datetime.utcnow(),
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "details": details,
    }
    await database.maps.update_one({"map_id": map_id}, {"$push": {"audit_trail": entry}})
    await append_audit_log(
        database,
        action_type=action,
        target_type="map",
        target_id=map_id,
        user_id=user_id,
        user_name=user_name,
        details={"message": details},
        provenance={"map_id": map_id},
    )
    await database.triage_actions.insert_one({
        "action_id": f"ACT-{uuid.uuid4().hex[:8].upper()}",
        "map_id": map_id,
        "timestamp": entry["timestamp"],
        "officer_id": user_id,
        "officer_name": user_name,
        "decision": action.replace("map_", ""),
        "title": details[:80] if details else None,
    })
