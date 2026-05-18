import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
sys.path.insert(0, 'c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/backend')
from config import settings
from services.watcher import process_circular

async def test():
    with open('c:/Users/hardi/Desktop/suraksha/suraksha-maps-v4/rbi_circular_demo.txt', 'r') as f:
        text = f.read()
    status, clauses, ms, conf = await process_circular(text.encode('utf-8'), 'rbi_circular_demo.txt')
    print('Status:', status)
    print('Clauses:', len(clauses))

if __name__ == '__main__':
    asyncio.run(test())
