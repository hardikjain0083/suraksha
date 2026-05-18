"""
Seed demo MAPs, departments, gap queue items, and golden-thread chains for triage dashboard.
Run: python seed_maps.py
"""
import asyncio
import uuid
import logging
from datetime import datetime, timedelta

import certifi
from motor.motor_asyncio import AsyncIOMotorClient

import sys
sys.path.insert(0, ".")
from config import settings
from services.map_generator import (
    build_provenance_path,
    build_timeline,
    build_evidence_items,
    suggest_evidence_types,
    _detect_clause_category,
    generate_title_from_clause,
    generate_description,
    calculate_priority_score,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Must match setup_atlas.py and models/map.py lifecycle statuses
MAP_STATUS_ENUM = [
    "draft", "pending_review", "approved", "rejected",
    "open", "in_progress", "pending_validation", "complete", "escalated", "cancelled",
]

MAPS_COLLECTION_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["map_id", "circular_id", "status", "owner_department_id"],
        "properties": {
            "status": {"enum": MAP_STATUS_ENUM},
            "policy_id": {"bsonType": "string"},
        },
    }
}


GAP_QUEUE_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["circular_id", "triage_status"],
        "properties": {
            "triage_status": {
                "enum": ["new", "assigned", "resolved", "dismissed", "escalated"]
            },
            "classification": {"enum": ["critical", "high", "medium", "low"]},
            "gap_status": {"bsonType": "string"},
        },
    }
}


async def ensure_maps_validator(database):
    """Update maps collection validator on existing DBs (collMod)."""
    try:
        await database.command(
            {
                "collMod": "maps",
                "validator": MAPS_COLLECTION_VALIDATOR,
                "validationLevel": "moderate",
            }
        )
        logger.info("Updated maps collection JSON schema validator.")
    except Exception as e:
        logger.warning("Could not update maps validator (non-fatal): %s", e)


async def ensure_gap_queue_validator(database):
    try:
        await database.command(
            {
                "collMod": "gap_queue",
                "validator": GAP_QUEUE_VALIDATOR,
                "validationLevel": "moderate",
            }
        )
        logger.info("Updated gap_queue collection JSON schema validator.")
    except Exception as e:
        logger.warning("Could not update gap_queue validator (non-fatal): %s", e)

DEPARTMENTS = [
    {"department_id": "DEPT-INFOSEC", "name": "Information Security", "parent_department_id": None},
    {"department_id": "DEPT-IT", "name": "IT Operations", "parent_department_id": "DEPT-INFOSEC"},
    {"department_id": "DEPT-COMPLIANCE", "name": "Compliance", "parent_department_id": None},
    {"department_id": "DEPT-LEGAL", "name": "Legal & Regulatory", "parent_department_id": "DEPT-COMPLIANCE"},
]

GOLDEN_THREADS = [
    {
        "circular_id": "RBI/2025-CRYPTO-001",
        "title": "RBI Master Direction on Data Encryption",
        "issuer": "RBI",
        "clause": "All regulated entities shall implement AES-256 encryption for customer PII at rest within 90 days.",
        "policy_id": "POL-CRYPTO-001",
        "policy_title": "Cryptography Standard v2.1",
        "dept": "DEPT-INFOSEC",
        "map_status": "complete",
        "assignee": "emp_3",
    },
    {
        "circular_id": "RBI/2025-MFA-002",
        "title": "RBI Circular on Strong Customer Authentication",
        "issuer": "RBI",
        "clause": "Banks must enforce multi-factor authentication for all internet banking and mobile banking channels.",
        "policy_id": "POL-AUTH-001",
        "policy_title": "Authentication Policy v1.2",
        "dept": "DEPT-IT",
        "map_status": "in_progress",
        "assignee": "emp_5",
    },
    {
        "circular_id": "CERT-In/2025-AUDIT-003",
        "title": "CERT-In Cyber Security Audit Framework",
        "issuer": "CERT-In",
        "clause": "Organizations shall maintain immutable audit logs with quarterly third-party review.",
        "policy_id": "POL-AUDIT-001",
        "policy_title": "Audit Logging Policy v3.0",
        "dept": "DEPT-COMPLIANCE",
        "map_status": "open",
        "assignee": "emp_7",
    },
]


def _make_map(
    map_id: str,
    gap_id: str,
    circular: dict,
    clause: str,
    clause_num: str,
    policy_id: str,
    policy_title: str,
    dept_id: str,
    dept_name: str,
    status: str,
    assignee: str | None,
    hist_count: int,
    is_historical: bool,
    days_offset: int = 45,
) -> dict:
    category = _detect_clause_category(clause)
    deadline = datetime.utcnow() + timedelta(days=days_offset)
    created = datetime.utcnow() - timedelta(days=30 - min(20, days_offset))
    provenance = build_provenance_path(
        circular["circular_id"],
        circular["title"],
        clause_num,
        clause,
        gap_id,
        "confirmed",
        policy_id,
        policy_title,
        dept_id,
        dept_name,
    )
    approved_at = created + timedelta(days=2) if status not in ("draft", "rejected") else None
    return {
        "map_id": map_id,
        "gap_id": gap_id,
        "circular_id": circular["circular_id"],
        "policy_id": policy_id,
        "title": generate_title_from_clause(clause),
        "description": generate_description(clause, circular["title"], policy_title),
        "requirements": [
            "Implement technical controls per regulatory clause",
            "Upload all mandated evidence before deadline",
            f"Obtain {dept_name} sign-off",
        ],
        "status": status,
        "owner_department_id": dept_id,
        "department_name": dept_name,
        "assigned_to": assignee,
        "assignee_name": f"Officer {assignee[-1]}" if assignee else None,
        "deadline": deadline,
        "priority_score": calculate_priority_score("high", deadline, circular.get("issuer")),
        "risk_level": "high",
        "provenance_path": provenance,
        "evidence_items": build_evidence_items(suggest_evidence_types(category)),
        "clause_text": clause,
        "historical_match_count": hist_count,
        "confidence_score": 0.92 if is_historical else 0.58,
        "is_historical_match": is_historical,
        "issuer": circular.get("issuer"),
        "audit_trail": [
            {
                "timestamp": created,
                "user_id": "system",
                "user_name": "MAP Generator",
                "action": "map_generated",
                "details": "Auto-generated from approved gap",
            },
        ],
        "timeline": build_timeline(status, created, approved_at),
        "created_at": created,
        "approved_at": approved_at,
        "completed_at": datetime.utcnow() - timedelta(days=1) if status == "complete" else None,
        "routing_source": "auto_routed" if is_historical else "pending_review",
    }


async def main():
    client = AsyncIOMotorClient(
        settings.mongodb_uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where()
    )
    database = client.suraksha_maps

    logger.info("Seeding departments...")
    for d in DEPARTMENTS:
        await database.departments.update_one(
            {"department_id": d["department_id"]}, {"$set": d}, upsert=True
        )

    await ensure_maps_validator(database)
    await ensure_gap_queue_validator(database)

    logger.info("Clearing maps, triage_actions, and demo gap_queue...")
    await database.maps.delete_many({})
    await database.triage_actions.delete_many({})
    await database.gap_queue.delete_many({"gap_id": {"$regex": "^GAP-DEMO"}})

    maps_docs = []
    gaps_docs = []
    triage_actions = []
    circulars_upsert = []

    for i, gt in enumerate(GOLDEN_THREADS):
        gap_id = f"GAP-DEMO-GT{i}"
        map_id = f"MAP-GT{i:03d}"
        circular = {
            "circular_id": gt["circular_id"],
            "title": gt["title"],
            "issuer": gt["issuer"],
        }
        circulars_upsert.append({
            "circular_id": gt["circular_id"],
            "title": gt["title"],
            "issuer": gt["issuer"],
            "date_issued": datetime.utcnow() - timedelta(days=60),
            "ingestion_status": "fully_parsed",
            "clauses_extracted": 1,
            "clauses": [
                {
                    "clause_number": f"{i + 1}.1",
                    "text": gt["clause"],
                    "obligation_type": "shall",
                    "severity": "high",
                    "gap_status": "confirmed",
                }
            ],
        })
        dept_name = next(d["name"] for d in DEPARTMENTS if d["department_id"] == gt["dept"])
        m = _make_map(
            map_id, gap_id, circular, gt["clause"], f"{i + 1}.1",
            gt["policy_id"], gt["policy_title"], gt["dept"], dept_name,
            gt["map_status"], gt["assignee"], hist_count=5, is_historical=True,
            days_offset=15 if gt["map_status"] == "complete" else 30,
        )
        maps_docs.append(m)
        gaps_docs.append({
            "gap_id": gap_id,
            "circular_id": gt["circular_id"],
            "clause_number": f"{i + 1}.1",
            "clause_text": gt["clause"],
            "gap_status": "confirmed",
            "classification": "high",
            "gap_description": gt["clause"],
            "severity": "high",
            "routing": "auto_routed",
            "triage_status": "resolved",
            "historical_match_count": 5,
            "similarity_score": 0.72,
            "top_policy_id": gt["policy_id"],
            "top_policy_title": gt["policy_title"],
            "generated_map_id": map_id,
            "created_at": datetime.utcnow() - timedelta(days=25),
        })
        triage_actions.append({
            "action_id": f"ACT-GT{i}",
            "map_id": map_id,
            "gap_id": gap_id,
            "timestamp": datetime.utcnow() - timedelta(days=20 - i),
            "officer_id": "emp_1",
            "officer_name": "Priya Sharma",
            "decision": "approved" if gt["map_status"] != "draft" else "generated",
            "title": m["title"],
        })

    extra_scenarios = [
        ("AES-256 encryption for databases", "auto_routed", "approved", 4, "DEPT-INFOSEC"),
        ("MFA for privileged admin accounts", "auto_routed", "approved", 3, "DEPT-IT"),
        ("Quarterly penetration testing", "auto_routed", "draft", 3, "DEPT-INFOSEC"),
        ("Data localization within India", "pending_review", "draft", 0, "DEPT-LEGAL"),
        ("AI model bias audit requirements", "pending_review", "draft", 1, "DEPT-COMPLIANCE"),
        ("Incident reporting within 6 hours", "pending_review", "draft", 0, "DEPT-INFOSEC"),
        ("Vendor risk assessment annually", "auto_routed", "approved", 5, "DEPT-COMPLIANCE"),
        ("TLS 1.3 for all external APIs", "auto_routed", "draft", 4, "DEPT-IT"),
        ("Board-level cyber risk reporting", "pending_review", "draft", 0, "DEPT-LEGAL"),
        ("Customer consent for data sharing", "pending_review", "rejected", 0, "DEPT-LEGAL"),
    ]

    for j, (clause, routing, status, hist, dept) in enumerate(extra_scenarios):
        gap_id = f"GAP-DEMO-{j:03d}"
        map_id = f"MAP-DEMO-{j:03d}"
        circ_id = f"SEBI/2026-DEMO-{j:03d}"
        dept_name = next((d["name"] for d in DEPARTMENTS if d["department_id"] == dept), "Compliance")
        circular = {"circular_id": circ_id, "title": f"SEBI Demo Circular {j}", "issuer": "SEBI"}
        await database.circulars.update_one(
            {"circular_id": circ_id},
            {
                "$set": {
                    **circular,
                    "date_issued": datetime.utcnow(),
                    "ingestion_status": "fully_parsed",
                    "clauses": [{"clause_number": "1.0", "text": clause, "severity": "medium"}],
                }
            },
            upsert=True,
        )
        is_hist = routing == "auto_routed"
        m = _make_map(
            map_id, gap_id, circular, clause, "1.0",
            f"POL-DEMO-{j}", f"Demo Policy {j}", dept, dept_name,
            status, None, hist, is_hist,
        )
        maps_docs.append(m)
        gaps_docs.append({
            "gap_id": gap_id,
            "circular_id": circ_id,
            "clause_number": "1.0",
            "clause_text": clause,
            "gap_status": "confirmed",
            "classification": "medium",
            "gap_description": clause,
            "severity": "medium",
            "routing": routing,
            "triage_status": "new" if status == "draft" else "resolved",
            "historical_match_count": hist,
            "similarity_score": 0.65,
            "generated_map_id": map_id if status != "draft" or is_hist else None,
            "created_at": datetime.utcnow() - timedelta(days=5 + j),
        })
        if status in ("approved", "rejected", "complete"):
            triage_actions.append({
                "action_id": f"ACT-DEMO-{j}",
                "map_id": map_id,
                "gap_id": gap_id,
                "timestamp": datetime.utcnow() - timedelta(hours=j * 3),
                "officer_id": "emp_2",
                "officer_name": "Rajesh Kumar" if j % 2 == 0 else "Anita Desai",
                "decision": status if status != "draft" else "approved",
                "title": m["title"],
            })

    for c in circulars_upsert:
        await database.circulars.update_one({"circular_id": c["circular_id"]}, {"$set": c}, upsert=True)

    # Demo MAP for routing acceptance (POST /api/maps/MAP-2026-013/route → EMP-INFOSEC-003)
    map_013_circ = {
        "circular_id": "RBI/2026-045",
        "title": "RBI Cyber Security Circular 2026-045",
        "issuer": "RBI",
    }
    map_013 = _make_map(
        "MAP-2026-013",
        "GAP-ACCEPT-013",
        map_013_circ,
        "The bank shall update firewall configuration to remediate critical vulnerabilities within 30 days.",
        "5.1",
        "POL-NET-001",
        "Network Security Standard",
        "DEPT-INFOSEC",
        "Information Security",
        "approved",
        None,
        4,
        True,
        days_offset=20,
    )
    map_013["assigned_to"] = None
    map_013["status"] = "approved"
    await database.maps.update_one({"map_id": "MAP-2026-013"}, {"$set": map_013}, upsert=True)

    if maps_docs:
        await database.maps.insert_many(maps_docs)
    if gaps_docs:
        await database.gap_queue.insert_many(gaps_docs)
    if triage_actions:
        await database.triage_actions.insert_many(triage_actions)

    try:
        await database.triage_actions.create_index([("timestamp", -1)])
    except Exception:
        pass

    logger.info(
        "Seed complete: %d MAPs, %d gaps, %d triage actions, %d golden threads",
        len(maps_docs), len(gaps_docs), len(triage_actions), len(GOLDEN_THREADS),
    )
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
