from fastapi import APIRouter, HTTPException, Depends
from database import db
from services.gap_detector import detect_gaps_for_circular
from services.map_generator import generate_map_from_gap
from models.gap import GapDetectionResponse
from datetime import datetime
from api.auth import get_current_user

router = APIRouter()
GAP_ROLES = {"admin", "compliance_officer", "auditor", "department_head"}

def get_db():
    return db.client.suraksha_maps


@router.post("/detect/{circular_id:path}", response_model=GapDetectionResponse)
async def run_gap_detection(circular_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in GAP_ROLES:
        raise HTTPException(403, "Gap detection access required")
    database = get_db()
    try:
        result = await detect_gaps_for_circular(circular_id, database)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gap detection failed: {e}")


@router.get("/queue")
async def get_gap_queue(
    triage_status: str = None,
    classification: str = None,
    circular_id: str = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in GAP_ROLES:
        raise HTTPException(403, "Gap queue access required")
    database = get_db()
    query = {}
    if triage_status:
        query["triage_status"] = triage_status
    if classification:
        query["gap_status"] = classification
    if circular_id:
        query["circular_id"] = circular_id

    cursor = database.gap_queue.find(query).sort("created_at", -1)
    items = []
    async for item in cursor:
        item["_id"] = str(item["_id"])
        if isinstance(item.get("created_at"), datetime):
            item["created_at"] = item["created_at"].isoformat()
        items.append(item)

    auto_routed = [i for i in items if i.get("routing") == "auto_routed"]
    pending_review = [i for i in items if i.get("routing") == "pending_review"]

    return {
        "total": len(items),
        "auto_routed": auto_routed,
        "pending_review": pending_review,
        "all": items
    }


@router.get("/queue/{gap_id}")
async def get_gap_detail(gap_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in GAP_ROLES:
        raise HTTPException(403, "Gap queue access required")
    database = get_db()
    item = await database.gap_queue.find_one({"gap_id": gap_id})
    if not item:
        raise HTTPException(status_code=404, detail="Gap not found")
    item["_id"] = str(item["_id"])
    if isinstance(item.get("created_at"), datetime):
        item["created_at"] = item["created_at"].isoformat()
    return item


@router.post("/queue/{gap_id}/approve")
async def approve_gap(gap_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"admin", "compliance_officer"}:
        raise HTTPException(403, "Compliance officer access required")
    database = get_db()
    gap = await database.gap_queue.find_one({"gap_id": gap_id})
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    try:
        map_doc = await generate_map_from_gap(database, gap_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    map_id = map_doc["map_id"]
    await database.gap_queue.update_one(
        {"gap_id": gap_id},
        {"$set": {"triage_status": "resolved", "generated_map_id": map_id}},
    )

    return {"status": "approved", "map_id": map_id}


@router.post("/queue/{gap_id}/dismiss")
async def dismiss_gap(
    gap_id: str,
    reason: str = "False positive",
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in {"admin", "compliance_officer"}:
        raise HTTPException(403, "Compliance officer access required")
    database = get_db()
    result = await database.gap_queue.update_one(
        {"gap_id": gap_id},
        {"$set": {
            "triage_status": "dismissed",
            "dismiss_reason": reason,
            "dismissed_at": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gap not found")
    return {"status": "dismissed", "gap_id": gap_id}


@router.post("/queue/{gap_id}/escalate")
async def escalate_gap(gap_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"admin", "compliance_officer", "department_head"}:
        raise HTTPException(403, "Escalation access required")
    database = get_db()
    result = await database.gap_queue.update_one(
        {"gap_id": gap_id},
        {"$set": {"triage_status": "escalated", "escalated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Gap not found")
    return {"status": "escalated", "gap_id": gap_id}


@router.get("/circulars")
async def list_circulars_for_gap_detection(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in GAP_ROLES:
        raise HTTPException(403, "Gap detection access required")
    """Returns fully and partially parsed circulars eligible for gap detection."""
    database = get_db()
    cursor = database.circulars.find(
        {"ingestion_status": "fully_parsed"},
        {"circular_id": 1, "title": 1, "issuer": 1, "ingestion_status": 1, "clauses_extracted": 1}
    ).sort("date_issued", -1)
    
    items = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        items.append(c)
    return items
