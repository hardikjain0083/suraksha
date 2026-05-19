from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import Response
from database import db
from datetime import datetime
import hashlib

from models.circular import CircularResponse, ReparseOptions
from services.watcher import process_circular
from services.gridfs_service import upload_file_to_gridfs, download_file_from_gridfs
from services.circular_ids import generate_circular_id
from api.auth import get_current_user

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_PDF_PAGES = 100
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
INGESTION_ROLES = {"admin", "compliance_officer", "auditor"}


def get_db():
    return db.client.suraksha_maps


@router.post("/upload", response_model=dict)
async def upload_circular(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload and process a regulatory circular (PDF/DOCX/TXT, max 50 MB / 100 PDF pages)."""
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular ingestion access required")
    database = get_db()

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds 50 MB limit. Size: {len(file_bytes) / 1024 / 1024:.1f} MB",
        )

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    content_type = file.content_type or "application/octet-stream"

    if ext not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, DOCX, TXT",
        )

    pages_processed = 1
    if ext == "pdf":
        try:
            from io import BytesIO
            from PyPDF2 import PdfReader

            pages_processed = len(PdfReader(BytesIO(file_bytes)).pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not read PDF page count: {e}")
        if pages_processed > MAX_PDF_PAGES:
            raise HTTPException(
                status_code=413,
                detail=f"PDF exceeds {MAX_PDF_PAGES} page limit. Pages: {pages_processed}",
            )

    status, clauses, time_ms, confidence, full_text = await process_circular(
        file_bytes, file.filename
    )

    text_hash = hashlib.sha256((full_text or "").encode("utf-8")).hexdigest()
    existing = await database.circulars.find_one({"full_text_hash": text_hash})
    if existing:
        return {
            "status": "duplicate",
            "circular_id": existing["circular_id"],
            "ingestion_status": existing.get("ingestion_status"),
            "message": "Circular with identical content already exists",
        }

    gridfs_id = await upload_file_to_gridfs(file.filename, content_type, file_bytes)

    lower_name = (file.filename or "").lower()
    if "rbi" in lower_name:
        issuer = "RBI"
    elif "sebi" in lower_name:
        issuer = "SEBI"
    elif "cert-in" in lower_name or "cert_in" in lower_name:
        issuer = "CERT-In"
    elif "irdai" in lower_name:
        issuer = "IRDAI"
    else:
        issuer = "UNKNOWN"

    year = datetime.utcnow().year
    circ_id = await generate_circular_id(database, issuer, year)

    doc = {
        "circular_id": circ_id,
        "title": file.filename,
        "issuer": issuer,
        "date_issued": datetime.utcnow(),
        "ingestion_status": status,
        "clauses_extracted": len(clauses),
        "parser_version": "v2.0",
        "pages_processed": pages_processed,
        "processing_time_ms": time_ms,
        "extraction_confidence": confidence,
        "clauses": [c.model_dump() for c in clauses],
        "gridfs_id": gridfs_id,
        "full_text": full_text,
        "full_text_hash": text_hash,
        "uploaded_by": current_user["emp_id"],
    }

    await database.circulars.insert_one(doc)

    return {
        "circular_id": circ_id,
        "ingestion_status": status,
        "clauses_extracted": len(clauses),
        "processing_time_ms": time_ms,
        "extraction_confidence": round(confidence, 3),
        "issuer": issuer,
        "status": "created",
    }


@router.get("", response_model=dict)
async def list_circulars(
    status: str = None,
    issuer: str = None,
    search: str = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular access required")
    database = get_db()
    query: dict = {}
    if status:
        query["ingestion_status"] = status
    if issuer:
        query["issuer"] = issuer
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    cursor = database.circulars.find(query).sort("date_issued", -1)
    circulars = []
    async for c in cursor:
        c["_id"] = str(c["_id"])
        if isinstance(c.get("date_issued"), datetime):
            c["date_issued"] = c["date_issued"].isoformat()
        circulars.append(c)

    return {
        "circulars": circulars,
        "stats": {
            "total": len(circulars),
            "fully_parsed": sum(
                1 for c in circulars if c.get("ingestion_status") == "fully_parsed"
            ),
            "failed": sum(
                1 for c in circulars if c.get("ingestion_status") == "failed"
            ),
        },
    }


@router.get("/by-id", response_model=CircularResponse)
async def get_circular_by_query(circular_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular access required")
    """Lookup by full ID (supports slashes via query string)."""
    database = get_db()
    doc = await database.circulars.find_one({"circular_id": circular_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Circular not found")
    return CircularResponse(**doc)


@router.get("/{circular_id:path}", response_model=CircularResponse)
async def get_circular(circular_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular access required")
    database = get_db()
    doc = await database.circulars.find_one({"circular_id": circular_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Circular not found")
    return CircularResponse(**doc)


@router.post("/{circular_id:path}/reparse", response_model=dict)
async def reparse_circular(
    circular_id: str,
    options: ReparseOptions = None,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular access required")
    database = get_db()
    doc = await database.circulars.find_one({"circular_id": circular_id})
    if not doc or not doc.get("gridfs_id"):
        raise HTTPException(status_code=404, detail="Original file not found in GridFS")

    file_bytes, filename, _ = await download_file_from_gridfs(doc["gridfs_id"])
    status, clauses, time_ms, confidence, full_text = await process_circular(
        file_bytes, filename
    )
    text_hash = hashlib.sha256((full_text or "").encode("utf-8")).hexdigest()

    await database.circulars.update_one(
        {"circular_id": circular_id},
        {
            "$set": {
                "ingestion_status": status,
                "clauses": [c.model_dump() for c in clauses],
                "clauses_extracted": len(clauses),
                "processing_time_ms": time_ms,
                "extraction_confidence": confidence,
                "full_text": full_text,
                "full_text_hash": text_hash,
                "reparsed_at": datetime.utcnow(),
            }
        },
    )

    return {
        "status": "reparsed",
        "ingestion_status": status,
        "clauses_extracted": len(clauses),
        "processing_time_ms": time_ms,
    }


@router.get("/{circular_id:path}/download")
async def download_circular(circular_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in INGESTION_ROLES:
        raise HTTPException(403, "Circular access required")
    database = get_db()
    doc = await database.circulars.find_one({"circular_id": circular_id})
    if not doc or not doc.get("gridfs_id"):
        raise HTTPException(status_code=404, detail="File not found")

    content, filename, content_type = await download_file_from_gridfs(doc["gridfs_id"])

    return Response(
        content=content,
        media_type=content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
