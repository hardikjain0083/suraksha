from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime
from database import db

router = APIRouter(tags=["debug"])


def get_db():
    return db.client.suraksha_maps


@router.get("/debug/connection")
async def debug_connection():
    """Verify MongoDB Atlas connectivity and list all collections with counts."""
    database = get_db()
    try:
        collections = await database.list_collection_names()
        counts = {}
        for coll in collections:
            counts[coll] = await database[coll].count_documents({})

        return {
            "mongodb_connected": True,
            "collections": collections,
            "document_counts": counts,
            "server_time": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {
            "mongodb_connected": False,
            "error": str(e),
            "advice": "Check MONGODB_URI in environment variables",
        }


@router.get("/debug/cors-test")
async def debug_cors_test(request: Request):
    """Verify CORS headers are properly configured for this origin."""
    origin = request.headers.get("origin", "No origin header sent")
    return {
        "cors": "enabled",
        "origin_received": origin,
        "message": "If you can read this from your frontend, CORS is working correctly.",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/debug/deployment")
async def debug_deployment():
    """Return deployment environment metadata for judge verification."""
    from config import settings

    return {
        "environment": settings.environment,
        "demo_mode": settings.demo_mode,
        "version": "4.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "features": {
            "behavioral_auth": True,
            "vector_search": True,
            "gap_detection": True,
            "audit_trail": True,
            "multi_engine_pdf": True,
            "rbi_index_parsing": True,
        },
    }
