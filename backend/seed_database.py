import asyncio
import logging
import certifi
import uuid
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    def get_embedding(text):
        return model.encode(text).tolist()
except Exception as e:
    logger.warning(f"Failed to load sentence-transformers ({e}). Using mock embeddings.")
    def get_embedding(text):
        return [random.uniform(-1, 1) for _ in range(384)]

from seed_users_only import DEPARTMENTS, USERS
from core.security import get_password_hash

def generate_departments():
    return DEPARTMENTS

def generate_users(depts):
    pwd = get_password_hash("Demo@123")
    for u in USERS:
        u["hashed_password"] = pwd
    return USERS

def generate_golden_threads(users, depts):
    # Generates 3 cohesive chains of Circular -> Policy -> MAP -> Evidence
    threads = []
    topics = [
        ("Data Privacy 2026", "Mandatory encryption for all PII data at rest.", "Encrypt PII data in all DBs."),
        ("AI Usage Guidelines", "All AI models must be audited for bias quarterly.", "Implement quarterly bias audit for AI models."),
        ("Remote Access Security", "MFA required for all VPN connections.", "Enforce MFA on Cisco AnyConnect.")
    ]
    
    circulars, policies, maps, evidence, gap_queues, audit_logs = [], [], [], [], [], []
    
    for i, (topic, circ_text, action_text) in enumerate(topics):
        circ_id = f"circ_gt_{i}"
        pol_id = f"pol_gt_{i}"
        map_id = f"map_gt_{i}"
        dept = random.choice(depts)["department_id"]
        user = random.choice(users)["emp_id"]
        
        # Circular
        circular = {
            "circular_id": circ_id,
            "title": topic,
            "issuer": "Regulatory Body",
            "date_issued": datetime.now() - timedelta(days=30),
            "ingestion_status": "processed",
            "clauses": [
                {
                    "clause_id": f"clause_gt_{i}_1",
                    "text": circ_text,
                    "embedding": get_embedding(circ_text)
                }
            ]
        }
        circulars.append(circular)
        
        # Policy
        pol_text = f"Internal policy aligned with {topic}: {circ_text}"
        policy = {
            "policy_id": pol_id,
            "title": f"Internal {topic} Policy",
            "department_owner_id": dept,
            "status": "active",
            "content": pol_text,
            "embedding": get_embedding(pol_text)
        }
        policies.append(policy)
        
        # MAP
        map_doc = {
            "map_id": map_id,
            "circular_id": circ_id,
            "policy_id": pol_id,
            "status": "published",
            "owner_department_id": dept,
            "assigned_to": user,
            "deadline": datetime.now() + timedelta(days=15),
            "action_plan": action_text
        }
        maps.append(map_doc)
        
        # Evidence
        ev = {
            "evidence_id": f"ev_gt_{i}",
            "map_id": map_id,
            "uploaded_by": user,
            "upload_date": datetime.now() - timedelta(days=2),
            "file_url": f"https://suraksha-storage.local/ev_{i}.pdf",
            "status": "verified"
        }
        evidence.append(ev)
        
        # Gap Queue
        gq = {
            "circular_id": circ_id,
            "triage_status": "resolved",
            "classification": "high",
            "gap_description": f"Gap found during {topic} assessment."
        }
        gap_queues.append(gq)
        
        # Audit Logs
        audit_logs.extend([
            {"timestamp": datetime.now() - timedelta(days=29), "user_id": "system", "action_type": "circular_ingested", "map_id": None},
            {"timestamp": datetime.now() - timedelta(days=28), "user_id": user, "action_type": "policy_updated", "map_id": None},
            {"timestamp": datetime.now() - timedelta(days=25), "user_id": user, "action_type": "map_created", "map_id": map_id},
            {"timestamp": datetime.now() - timedelta(days=2), "user_id": user, "action_type": "evidence_uploaded", "map_id": map_id}
        ])
        
    return circulars, policies, maps, evidence, gap_queues, audit_logs

async def main():
    logger.info("Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    db = client.suraksha_maps
    
    logger.info("Clearing existing data...")
    for coll in ["users", "departments", "circulars", "policies", "maps", "evidence", "audit_logs", "gap_queue"]:
        await db[coll].delete_many({})

    logger.info("Generating Seed Data...")
    depts = generate_departments()
    users = generate_users(depts)
    c, p, m, e, gq, al = generate_golden_threads(users, depts)
    
    # Add some random extra data to meet counts
    for i in range(5):
        c.append({
            "circular_id": f"circ_rnd_{i}",
            "title": f"Random Circular {i}",
            "issuer": "Gov",
            "date_issued": datetime.now(),
            "ingestion_status": "pending",
            "clauses": [{"clause_id": f"rnd_cl_{i}", "text": "Pending analysis...", "embedding": get_embedding("Pending analysis...")}]
        })
        m.append({
            "map_id": f"map_rnd_{i}",
            "circular_id": f"circ_rnd_{i}",
            "policy_id": None,
            "status": "draft",
            "owner_department_id": depts[0]["department_id"],
            "assigned_to": users[0]["emp_id"],
            "deadline": datetime.now(),
            "action_plan": "TBD"
        })

    logger.info("Inserting Data into MongoDB...")
    if depts: await db.departments.insert_many(depts)
    if users: await db.users.insert_many(users)
    if c: await db.circulars.insert_many(c)
    if p: await db.policies.insert_many(p)
    if m: await db.maps.insert_many(m)
    if e: await db.evidence.insert_many(e)
    if gq: await db.gap_queue.insert_many(gq)
    if al: await db.audit_logs.insert_many(al)
    
    logger.info("Database Seeding Complete! Embeddings generated and attached.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
