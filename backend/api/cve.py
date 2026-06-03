from fastapi import APIRouter, Depends, HTTPException
from database import db
from services.cve_correlator import get_recent_cves, get_cve_details
from services.threat_mapper import correlate_advisory_to_assets
from api.auth import get_current_user
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/api/cve", tags=["CVE Correlator"])

class CorrelationRequest(BaseModel):
    cves: List[str]
    systems_affected: List[str] = []
    text: str = ""

def get_db():
    return db.client.suraksha_maps

@router.get("/feed", response_model=List[Dict[str, Any]])
async def get_cve_feed(current_user: dict = Depends(get_current_user)):
    """Retrieve the recent vulnerability feed."""
    return get_recent_cves()

@router.get("/{cve_id}", response_model=Dict[str, Any])
async def get_cve(cve_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve details for a specific CVE ID."""
    return get_cve_details(cve_id)

@router.post("/correlate", response_model=List[Dict[str, Any]])
async def correlate_cves(req: CorrelationRequest, current_user: dict = Depends(get_current_user)):
    """Correlate a list of CVEs/software stacks with bank systems."""
    database = get_db()
    correlated = await correlate_advisory_to_assets(
        database=database,
        cves=req.cves,
        systems_affected=req.systems_affected,
        full_text=req.text
    )
    return correlated
