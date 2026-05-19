import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
sys.path.insert(0, 'c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend')
from config import settings
from services.gap_detector import detect_gaps_for_circular

async def test():
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.suraksha_maps
    circular = await db.circulars.find_one()
    if not circular:
        print("No circular found.")
        return
    print(f"Testing gap detection for: {circular['circular_id']}")
    res = await detect_gaps_for_circular(circular['circular_id'], db)
    print(res)

if __name__ == '__main__':
    asyncio.run(test())
