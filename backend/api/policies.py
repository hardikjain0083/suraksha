from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from database import db
from datetime import datetime
import uuid
import sys
sys.path.insert(0, ".")
from services.watcher import process_circular, extract_pdf_robust, get_embedder, generate_embeddings

router = APIRouter()

def get_db():
    return db.client.suraksha_maps

@router.get("/")
async def get_policies():
    database = get_db()
    cursor = database.policies.find({}).sort("valid_from", -1)
    policies = []
    async for p in cursor:
        p["id"] = p.get("policy_id", str(p["_id"]))
        p["_id"] = str(p["_id"])
        if "valid_from" in p and p["valid_from"]:
            p["valid_from"] = p["valid_from"].isoformat() if hasattr(p["valid_from"], 'isoformat') else str(p["valid_from"])
        if "valid_until" in p and p["valid_until"]:
            p["valid_until"] = p["valid_until"].isoformat() if hasattr(p["valid_until"], 'isoformat') else str(p["valid_until"])
        policies.append(p)
    return policies

@router.post("/upload")
async def upload_policy(
    file: UploadFile = File(...),
    title: str = Form(...),
    department: str = Form(...),
    version: str = Form(...)
):
    database = get_db()
    file_bytes = await file.read()
    
    # Simple extraction
    ext = file.filename.rsplit(".", 1)[-1].lower()
    text = ""
    
    if ext == "pdf":
        res = await extract_pdf_robust(file_bytes)
        text = res.text
    else:
        text = file_bytes.decode("utf-8", errors="ignore")
        
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from document")

    embs = await generate_embeddings([text])
    embedding = embs[0] if embs else []
        
    policy_id = f"POL-{str(uuid.uuid4())[:8].upper()}"
    
    doc = {
        "policy_id": policy_id,
        "title": title,
        "version": version,
        "department_owner_id": department,
        "department": department,
        "status": "active",
        "valid_from": datetime.utcnow(),
        "valid_until": None,
        "content": text,
        "full_text": text,
        "embedding": embedding,
        "covers_clauses": []
    }
    
    await database.policies.insert_one(doc)
    
    return {"status": "success", "policy_id": policy_id}

