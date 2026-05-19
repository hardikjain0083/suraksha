import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

async def main():
    client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    db = client.suraksha_maps
    await db.command("collMod", "circulars", validationLevel="off")
    print("Validation disabled for circulars!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
