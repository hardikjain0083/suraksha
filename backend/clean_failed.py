import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
sys.path.insert(0, 'c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend')
from config import settings

async def clean():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.suraksha_maps
    res = await db.circulars.delete_many({"ingestion_status": "failed"})
    print(f"Deleted {res.deleted_count} failed circulars")

if __name__ == '__main__':
    asyncio.run(clean())
