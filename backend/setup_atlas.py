import asyncio
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import CollectionInvalid
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAP_STATUS_ENUM = [
    "draft",
    "pending_review",
    "approved",
    "open",
    "in_progress",
    "pending_validation",
    "complete",
    "escalated",
    "rejected",
    "cancelled",
]

SCHEMAS = {
    "users": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["emp_id", "email", "role"],
            "properties": {
                "emp_id": {"bsonType": "string"},
                "email": {"bsonType": "string", "pattern": "^.+@.+$"},
                "role": {
                    "enum": [
                        "admin",
                        "compliance_officer",
                        "department_head",
                        "auditor",
                        "employee",
                    ]
                },
                "status": {"enum": ["active", "inactive", "suspended", "pending", "failed"]},
                "active_maps_count": {"bsonType": "int"},
            },
        }
    },
    "circulars": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["circular_id", "title", "issuer", "ingestion_status"],
            "properties": {
                "circular_id": {"bsonType": "string"},
                "title": {"bsonType": "string"},
                "issuer": {"enum": ["RBI", "SEBI", "CERT-In", "Internal", "UNKNOWN", "IRDAI"]},
                "ingestion_status": {
                    "enum": [
                        "pending",
                        "fully_parsed",
                        "partially_parsed",
                        "failed",
                        "pending_review",
                        "processed",
                    ]
                },
                "full_text_hash": {"bsonType": "string"},
                "date_issued": {"bsonType": "date"},
            },
        }
    },
    "policies": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["policy_id", "title", "department_owner_id", "status", "content"],
            "properties": {
                "status": {"enum": ["draft", "active", "archived"]},
            },
        }
    },
    "maps": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["map_id", "circular_id", "status", "owner_department_id"],
            "properties": {
                "status": {"enum": MAP_STATUS_ENUM},
                "policy_id": {"bsonType": "string"},
            },
        }
    },
    "audit_logs": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": [
                "log_id",
                "timestamp",
                "user_id",
                "action_type",
                "tamper_evident_hash",
                "previous_log_hash",
            ],
            "properties": {
                "log_id": {"bsonType": "string"},
                "timestamp": {"bsonType": "date"},
                "action_type": {"bsonType": "string"},
                "tamper_evident_hash": {"bsonType": "string"},
                "previous_log_hash": {"bsonType": "string"},
            },
        }
    },
    "gap_queue": {
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
    },
    "tickets": {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["ticket_id", "title", "status", "assignee", "linked_map"],
            "properties": {
                "ticket_id": {"bsonType": "string"},
                "title": {"bsonType": "string"},
                "status": {"enum": ["open", "in_progress", "closed"]},
                "assignee": {"bsonType": "string"},
                "linked_map": {"bsonType": "string"},
                "created_at": {"bsonType": "date"},
                "updated_at": {"bsonType": "date"},
            },
        }
    },
}

COLLECTIONS = [
    "users",
    "departments",
    "circulars",
    "policies",
    "maps",
    "evidence",
    "audit_logs",
    "sessions",
    "gap_queue",
    "tickets",
    "counters",
]


async def create_collections_with_validators(db):
    for coll_name in COLLECTIONS:
        try:
            validator = SCHEMAS.get(coll_name, {})
            if validator:
                await db.create_collection(
                    coll_name, validator=validator, validationLevel="moderate"
                )
                logger.info("Created collection '%s' with schema validator.", coll_name)
            else:
                await db.create_collection(coll_name)
                logger.info("Created collection '%s'.", coll_name)
        except CollectionInvalid:
            logger.warning("Collection '%s' already exists.", coll_name)


async def create_standard_indexes(db):
    await db.users.create_index("emp_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("department_id")
    await db.users.create_index("active_maps_count")

    await db.circulars.create_index("circular_id", unique=True)
    await db.circulars.create_index("full_text_hash", unique=True, sparse=True)
    await db.circulars.create_index("issuer")
    await db.circulars.create_index("ingestion_status")

    await db.maps.create_index("map_id", unique=True)
    await db.maps.create_index("status")
    await db.maps.create_index("assigned_to")

    await db.policies.create_index("policy_id", unique=True)
    await db.audit_logs.create_index([("timestamp", -1)])
    await db.audit_logs.create_index("log_id", unique=True)
    await db.gap_queue.create_index("triage_status")
    await db.tickets.create_index("ticket_id", unique=True)
    await db.evidence.create_index("evidence_id", unique=True)

    logger.info("All standard indexes created successfully.")


async def create_atlas_search_indexes(db):
    logger.info("Creating Atlas Search & Vector Search Indexes...")
    circulars_vector_def = {
        "name": "vector_index_regulations",
        "type": "vectorSearch",
        "definition": {
            "fields": [{
                "type": "vector",
                "path": "clauses.embedding",
                "numDimensions": 384,
                "similarity": "cosine",
            }]
        },
    }
    policies_vector_def = {
        "name": "vector_index_policies",
        "type": "vectorSearch",
        "definition": {
            "fields": [{
                "type": "vector",
                "path": "embedding",
                "numDimensions": 384,
                "similarity": "cosine",
            }]
        },
    }
    try:
        await db.command(
            "createSearchIndexes",
            "circulars",
            indexes=[circulars_vector_def],
        )
    except Exception as e:
        logger.error("Failed to create circulars vector index: %s", e)
    try:
        await db.command(
            "createSearchIndexes",
            "policies",
            indexes=[policies_vector_def],
        )
    except Exception as e:
        logger.error("Failed to create policies vector index: %s", e)


async def main():
    logger.info("Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where(),
    )
    database = client.suraksha_maps

    await create_collections_with_validators(database)
    await create_standard_indexes(database)
    await create_atlas_search_indexes(database)

    logger.info("MongoDB Atlas setup complete (%d collections).", len(COLLECTIONS))
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
