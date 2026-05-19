import asyncio
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def wait_for_index_ready(db, coll_name, index_name, max_wait=300, interval=10):
    """Poll Atlas until vector search index is ready."""
    elapsed = 0
    while elapsed < max_wait:
        try:
            # We can use the `$listSearchIndexes` aggregation
            cursor = db[coll_name].aggregate([{"$listSearchIndexes": {"name": index_name}}])
            indexes = await cursor.to_list(length=1)
            if indexes and indexes[0].get("status") == "READY":
                logger.info(f"✅ Index {index_name} on {coll_name} is READY!")
                return True
        except Exception as e:
            logger.warning(f"Error checking index status: {e}")
            
        print(f"⏳ Index {index_name} on {coll_name} not ready yet... ({elapsed}s elapsed)")
        await asyncio.sleep(interval)
        elapsed += interval
    raise TimeoutError(f"Index {index_name} not ready after {max_wait}s")

async def verify_counts(db):
    logger.info("--- Document Counts ---")
    colls = ["users", "departments", "circulars", "policies", "maps", "evidence", "audit_logs", "gap_queue"]
    for c in colls:
        count = await db[c].count_documents({})
        logger.info(f"{c}: {count}")

async def test_vector_search(db):
    logger.info("--- Testing Vector Search ---")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_vector = model.encode("privacy and encryption").tolist()
    
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index_policies",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 10,
                "limit": 2
            }
        },
        {
            "$project": {
                "title": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]
    
    try:
        results = await db.policies.aggregate(pipeline).to_list(length=2)
        logger.info(f"Vector Search Results: {results}")
    except Exception as e:
        logger.error(f"Vector Search failed: {e}")

async def main():
    logger.info("Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000, tlsCAFile=certifi.where())
    db = client.suraksha_maps
    
    # 1. Verify collections and counts
    await verify_counts(db)
    
    # 2. Wait for indexes
    logger.info("--- Waiting for Vector Indexes ---")
    try:
        await wait_for_index_ready(db, "circulars", "vector_index_regulations")
        await wait_for_index_ready(db, "policies", "vector_index_policies")
    except TimeoutError as e:
        logger.error(e)
        client.close()
        return

    # 3. Test Vector Search
    await test_vector_search(db)
    
    logger.info("Verification Complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
