from fastapi import APIRouter, HTTPException

from database import db
from services.validator_service import validate_evidence

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])


def get_db():
    return db.client.suraksha_maps


@router.post("/{evidence_id}/validate")
async def validate_evidence_endpoint(evidence_id: str):
    database = get_db()
    try:
        return await validate_evidence(database, evidence_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {e}")
