from fastapi import APIRouter, Depends, HTTPException
from database import db
from models.asset import Asset
from api.auth import get_current_user
from typing import List

router = APIRouter(prefix="/api/assets", tags=["Asset Inventory"])

def get_db():
    return db.client.suraksha_maps

@router.get("", response_model=List[Asset])
async def list_assets(current_user: dict = Depends(get_current_user)):
    """List all registered bank assets and systems."""
    database = get_db()
    cursor = database.assets.find({})
    assets = await cursor.to_list(length=1000)
    return [Asset(**a) for a in assets]

@router.post("", response_model=Asset, status_code=201)
async def create_asset(asset: Asset, current_user: dict = Depends(get_current_user)):
    """Register a new bank system asset (Compliance / Admin access required)."""
    if current_user.get("role") not in ("admin", "compliance_officer"):
        raise HTTPException(status_code=403, detail="Access denied. Admin or Compliance role required.")
        
    database = get_db()
    existing = await database.assets.find_one({"asset_id": asset.asset_id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset with ID {asset.asset_id} already exists.")
        
    await database.assets.insert_one(asset.model_dump())
    return asset
