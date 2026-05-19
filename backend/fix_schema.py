import asyncio
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_schema():
    client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    db = client.suraksha_maps
    
    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["circular_id", "issuer", "date_issued", "ingestion_status", "clauses"],
            "properties": {
                "circular_id": {"bsonType": "string"},
                "ingestion_status": {"enum": ["pending", "processed", "failed", "partially_parsed", "fully_parsed"]},
                "clauses": {
                    "bsonType": "array",
                    "items": {
                        "bsonType": "object",
                        "required": ["text"],
                        "properties": {
                            "text": {"bsonType": "string"}
                        }
                    }
                }
            }
        }
    }
    
    try:
        await db.command("collMod", "circulars", validator=validator)
        logger.info("Successfully updated 'circulars' schema validator.")
    except Exception as e:
        logger.error(f"Error updating schema: {e}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_schema())
