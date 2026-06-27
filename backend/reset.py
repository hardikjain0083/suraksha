import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def reset_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client.suraksha_maps
    result = await db.users.update_many(
        {},
        {"$set": {"active_gap_count": 0, "availability_status": "available"}}
    )
    print(f"Updated {result.modified_count} users")

if __name__ == '__main__':
    asyncio.run(reset_users())
