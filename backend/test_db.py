import asyncio
from database import connect_to_mongo, db, close_mongo_connection

async def test():
    await connect_to_mongo()
    cursor = db.client.suraksha_maps.users.find()
    async for emp in cursor:
        print(f"Emp ID: {emp.get('emp_id')}, dept: {emp.get('dept')}, department_id: {emp.get('department_id')}")
    await close_mongo_connection()

asyncio.run(test())
