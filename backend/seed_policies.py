import asyncio
import certifi
import logging
import random
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import config
import sys
sys.path.insert(0, ".")
from config import settings

_use_mock_embeddings = False
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    def get_embedding(text):
        return model.encode(text).tolist()
except Exception as e:
    logger.warning(f"SentenceTransformer unavailable: {e}. Using mock embeddings.")
    _use_mock_embeddings = True
    def get_embedding(text):
        return [random.uniform(-1, 1) for _ in range(384)]


POLICIES_WITH_GAPS = [
    {
        "policy_id": "POL-CRYPTO-001",
        "title": "Cryptography Standard v2.1",
        "version": "2.1",
        "department_owner_id": "DEPT-INFOSEC",
        "status": "active",
        "valid_from": datetime(2025, 1, 1),
        "valid_until": None,
        "content": (
            "1. All data at rest must be encrypted using industry-standard algorithms. "
            "2. Key management shall follow ISO 27001 guidelines. "
            "3. TLS 1.2 is required for all external connections. "
            "4. Cryptographic keys shall be rotated every 12 months."
        ),
        # NOTE: Says 'TLS 1.2' not 'TLS 1.3', missing AES-256 — intentional GAP!
        "covers_clauses": []
    },
    {
        "policy_id": "POL-AUTH-001",
        "title": "Authentication Policy v1.2",
        "version": "1.2",
        "department_owner_id": "DEPT-IT",
        "status": "active",
        "valid_from": datetime(2025, 1, 1),
        "valid_until": None,
        "content": (
            "1. Passwords must be minimum 12 characters with complexity requirements. "
            "2. Single sign-on (SSO) is implemented for all applications. "
            "3. Privileged access requires additional approval workflow. "
            "4. Account lockout is enforced after 5 failed attempts."
        ),
        # NOTE: No MFA / multi-factor mentioned — intentional GAP!
        "covers_clauses": []
    },
    {
        "policy_id": "POL-AUDIT-001",
        "title": "Audit Logging Policy v3.0",
        "version": "3.0",
        "department_owner_id": "DEPT-COMPLIANCE",
        "status": "active",
        "valid_from": datetime(2025, 6, 1),
        "valid_until": None,
        "content": (
            "1. All system events shall be logged to an immutable audit trail. "
            "2. Audit logs must be retained for a minimum of 7 years. "
            "3. Quarterly review of audit logs is mandatory. "
            "4. Tamper-evident logging is enforced through cryptographic signing. "
            "5. The SIEM platform will generate real-time alerts for anomalies."
        ),
        "covers_clauses": []
    },
    {
        "policy_id": "POL-VULN-001",
        "title": "Vulnerability Management Policy v1.0",
        "version": "1.0",
        "department_owner_id": "DEPT-INFOSEC",
        "status": "active",
        "valid_from": datetime(2025, 1, 1),
        "valid_until": None,
        "content": (
            "1. Vulnerability scans shall be conducted quarterly on all infrastructure. "
            "2. Critical vulnerabilities must be remediated within 24 hours. "
            "3. Penetration tests are performed annually by third-party assessors. "
            "4. Scan results are reported to the CISO and risk committee."
        ),
        "covers_clauses": []
    },
    {
        "policy_id": "POL-SOC-001",
        "title": "Security Operations Policy v2.0",
        "version": "2.0",
        "department_owner_id": "DEPT-SOC",
        "status": "active",
        "valid_from": datetime(2025, 1, 1),
        "valid_until": None,
        "content": (
            "1. A dedicated Security Operations Center (SOC) operates 24x7. "
            "2. SIEM platform aggregates all security event logs for real-time monitoring. "
            "3. Incident response playbooks are reviewed and updated quarterly. "
            "4. All EDR agents must be deployed on endpoints and kept updated. "
            "5. Zero trust network segmentation is enforced across all data centers."
        ),
        "covers_clauses": []
    }
]


async def main():
    client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    db = client.suraksha_maps

    logger.info("Clearing existing policies...")
    await db.policies.delete_many({"policy_id": {"$in": [p["policy_id"] for p in POLICIES_WITH_GAPS]}})

    logger.info("Inserting policies with intentional gaps...")
    for policy in POLICIES_WITH_GAPS:
        policy_copy = dict(policy)
        policy_copy["embedding"] = get_embedding(policy_copy["content"])
        await db.policies.insert_one(policy_copy)
        logger.info(f"  ✅ Inserted: {policy['policy_id']} — {policy['title']}")

    logger.info("Done! Policies seeded with intentional coverage gaps.")
    logger.info("""
Demo moments:
  POL-CRYPTO-001 → Missing AES-256, TLS 1.3 (says 'industry-standard', 'TLS 1.2')
  POL-AUTH-001   → Missing MFA, multi-factor, hardware token
  POL-AUDIT-001  → Covers: audit trail, quarterly, SIEM  
  POL-VULN-001   → Covers: quarterly, vulnerability scan, penetration test
  POL-SOC-001    → Covers: 24x7, SOC, SIEM, EDR, zero trust
""")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
