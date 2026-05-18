import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import db
from api.auth import get_current_user
from models.map import (
    MapGenerateRequest,
    MapGenerateResponse,
    MapApproveBody,
    MapRejectBody,
    MapExtendBody,
    MapEscalateBody,
    MapBulkApproveBody,
    MapListResponse,
    MapListItem,
    MapDetailResponse,
    ProvenanceNode,
    EvidenceItem,
    AuditTrailEntry,
    TimelineEntry,
    SimilarMapRef,
    TriageDashboardResponse,
    TriageMapCard,
    TriageAction,
)
from services.map_generator import (
    generate_map_from_gap,
    log_audit,
    DEFAULT_DEADLINE_DAYS,
    build_timeline,
    suggest_evidence_types,
    _detect_clause_category,
    generate_title_from_clause,
    generate_description,
    calculate_priority_score,
    resolve_department_graph_lookup,
    find_similar_historical_maps,
    get_circular_context,
    build_provenance_path,
    severity_to_risk,
)

router = APIRouter()


def get_db():
    return db.client.suraksha_maps


def _serialize_doc(doc: dict) -> dict:
    if not doc:
        return doc
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    for key in ("created_at", "deadline", "approved_at", "completed_at", "timestamp"):
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc


def _days_until(deadline: datetime) -> int:
    if isinstance(deadline, str):
        deadline = datetime.fromisoformat(deadline.replace("Z", ""))
    return (deadline - datetime.utcnow()).days


def _evidence_pct(items: list) -> float:
    if not items:
        return 0.0
    uploaded = sum(1 for e in items if e.get("uploaded"))
    return round(100.0 * uploaded / len(items), 1)


async def _gap_to_triage_card(database, gap: dict, map_doc: Optional[dict] = None) -> TriageMapCard:
    circular_ctx = await get_circular_context(
        database, gap["circular_id"], gap.get("clause_number")
    )
    clause_text = gap.get("clause_text") or circular_ctx["clause_text"]
    category = _detect_clause_category(clause_text)
    dept_id, dept_name = await resolve_department_graph_lookup(
        database, gap, gap.get("top_policy_id"), category
    )
    similar_refs, hist_count = await find_similar_historical_maps(database, clause_text)
    if gap.get("historical_match_count"):
        hist_count = max(hist_count, gap["historical_match_count"])

    deadline = datetime.utcnow() + timedelta(days=DEFAULT_DEADLINE_DAYS)
    if map_doc and map_doc.get("deadline"):
        deadline = map_doc["deadline"]

    provenance = build_provenance_path(
        gap["circular_id"],
        circular_ctx["title"],
        str(gap.get("clause_number", "")),
        clause_text,
        gap["gap_id"],
        gap.get("gap_status", "confirmed"),
        gap.get("top_policy_id"),
        gap.get("top_policy_title"),
        dept_id,
        dept_name,
    )

    title = map_doc.get("title") if map_doc else generate_title_from_clause(clause_text)
    desc = map_doc.get("description") if map_doc else generate_description(
        clause_text, circular_ctx["title"], gap.get("top_policy_title")
    )
    confidence = map_doc.get("confidence_score") if map_doc else min(
        0.99, 0.4 + hist_count * 0.12 + (gap.get("similarity_score") or 0) * 0.35
    )

    return TriageMapCard(
        map_id=map_doc.get("map_id") if map_doc else gap.get("generated_map_id"),
        gap_id=gap["gap_id"],
        title=title,
        description=desc,
        status=map_doc.get("status", "pending") if map_doc else "pending",
        historical_match_count=hist_count,
        confidence_score=confidence,
        similar_policies_count=len(gap.get("policy_matches") or []),
        provenance_path=[ProvenanceNode(**p) for p in provenance],
        similar_past_maps=similar_refs,
        suggested_evidence=[e["type"] for e in suggest_evidence_types(category)],
        deadline=deadline,
        priority_score=map_doc.get("priority_score", 50) if map_doc else calculate_priority_score(
            gap.get("severity", "medium"), deadline, circular_ctx.get("issuer")
        ),
        risk_level=map_doc.get("risk_level") if map_doc else severity_to_risk(
            gap.get("severity"), gap.get("gap_status", "confirmed")
        ),
        clause_text=clause_text,
        circular_id=gap["circular_id"],
        circular_title=circular_ctx["title"],
        routing=gap.get("routing", "pending_review"),
        gap_status=gap.get("gap_status", "confirmed"),
        severity=gap.get("severity"),
        department_id=dept_id,
        department_name=dept_name,
        suggested_department_id=dept_id,
        suggested_map_title=title,
    )


def _map_to_detail(m: dict) -> MapDetailResponse:
    provenance = [ProvenanceNode(**p) for p in m.get("provenance_path", [])]
    evidence = [EvidenceItem(**e) for e in m.get("evidence_items", [])]
    audit = [
        AuditTrailEntry(
            timestamp=a["timestamp"] if isinstance(a["timestamp"], datetime) else datetime.fromisoformat(str(a["timestamp"])),
            user_id=a["user_id"],
            user_name=a.get("user_name"),
            action=a["action"],
            details=a.get("details"),
        )
        for a in m.get("audit_trail", [])
    ]
    timeline = [
        TimelineEntry(
            stage=t["stage"],
            label=t["label"],
            timestamp=t.get("timestamp"),
            completed=t.get("completed", False),
        )
        for t in m.get("timeline", [])
    ]
    similar = [SimilarMapRef(**s) for s in m.get("similar_past_maps", [])]
    deadline = m["deadline"] if isinstance(m["deadline"], datetime) else datetime.fromisoformat(str(m["deadline"]))

    return MapDetailResponse(
        map_id=m["map_id"],
        title=m.get("title", "Untitled MAP"),
        description=m.get("description", ""),
        requirements=m.get("requirements", []),
        status=m.get("status", "draft"),
        priority_score=m.get("priority_score", 50),
        risk_level=m.get("risk_level", "medium"),
        circular_id=m["circular_id"],
        policy_id=m.get("policy_id") if m.get("policy_id") != "UNASSIGNED" else None,
        gap_id=m.get("gap_id"),
        owner_department_id=m["owner_department_id"],
        department_name=m.get("department_name"),
        assigned_to=m.get("assigned_to"),
        assignee_name=m.get("assignee_name"),
        deadline=deadline,
        provenance_path=provenance,
        evidence_items=evidence,
        audit_trail=audit,
        timeline=timeline,
        similar_past_maps=similar,
        historical_match_count=m.get("historical_match_count", 0),
        confidence_score=m.get("confidence_score", 0.0),
        is_historical_match=m.get("is_historical_match", False),
        clause_text=m.get("clause_text"),
        escalation_status=m.get("escalation_status"),
        parent_map_id=m.get("parent_map_id"),
        created_at=m.get("created_at", datetime.utcnow()),
        approved_at=m.get("approved_at"),
        issuer=m.get("issuer"),
    )


@router.post("/generate", response_model=MapGenerateResponse)
async def generate_map(body: MapGenerateRequest):
    database = get_db()
    try:
        doc = await generate_map_from_gap(
            database, body.gap_id, body.officer_id or "system", body.officer_name or "Officer"
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return MapGenerateResponse(
        map_id=doc["map_id"],
        status=doc["status"],
        provenance_path=[ProvenanceNode(**p) for p in doc["provenance_path"]],
        priority_score=doc["priority_score"],
        title=doc["title"],
        deadline=doc["deadline"],
        is_historical_match=doc.get("is_historical_match", False),
    )


@router.get("/triage/dashboard", response_model=TriageDashboardResponse)
async def triage_dashboard():
    """Compliance triage center: auto-routed, pending review, recently processed."""
    database = get_db()

    gap_query = {"triage_status": {"$nin": ["dismissed", "resolved"]}}
    cursor = database.gap_queue.find(gap_query).sort("created_at", -1)
    auto_routed: list[TriageMapCard] = []
    pending_review: list[TriageMapCard] = []

    async for gap in cursor:
        map_doc = None
        if gap.get("generated_map_id"):
            map_doc = await database.maps.find_one({"map_id": gap["generated_map_id"]})
        card = await _gap_to_triage_card(database, gap, map_doc)
        if gap.get("routing") == "auto_routed":
            if not card.map_id and map_doc:
                card.map_id = map_doc.get("map_id")
            auto_routed.append(card)
        else:
            pending_review.append(card)

    # Also include draft MAPs without active gaps
    draft_cursor = database.maps.find({"status": {"$in": ["draft", "approved"]}}).sort("created_at", -1)
    seen_gaps = {c.gap_id for c in auto_routed + pending_review}
    async for m in draft_cursor:
        gid = m.get("gap_id")
        if gid in seen_gaps:
            continue
        gap = await database.gap_queue.find_one({"gap_id": gid}) if gid else None
        if gap:
            continue
        if m.get("is_historical_match"):
            auto_routed.append(
                TriageMapCard(
                    map_id=m["map_id"],
                    gap_id=gid or m["map_id"],
                    title=m.get("title", ""),
                    description=m.get("description", ""),
                    status=m.get("status", "draft"),
                    historical_match_count=m.get("historical_match_count", 0),
                    confidence_score=m.get("confidence_score", 0.8),
                    provenance_path=[ProvenanceNode(**p) for p in m.get("provenance_path", [])],
                    similar_past_maps=[SimilarMapRef(**s) for s in m.get("similar_past_maps", [])],
                    suggested_evidence=[e.get("evidence_type", "") for e in m.get("evidence_items", [])],
                    deadline=m["deadline"],
                    priority_score=m.get("priority_score", 50),
                    risk_level=m.get("risk_level", "medium"),
                    clause_text=m.get("clause_text", ""),
                    circular_id=m["circular_id"],
                    routing="auto_routed",
                    gap_status="confirmed",
                )
            )
        else:
            pending_review.append(
                TriageMapCard(
                    map_id=m["map_id"],
                    gap_id=gid or m["map_id"],
                    title=m.get("title", ""),
                    description=m.get("description", ""),
                    status=m.get("status", "draft"),
                    historical_match_count=m.get("historical_match_count", 0),
                    confidence_score=m.get("confidence_score", 0.5),
                    provenance_path=[ProvenanceNode(**p) for p in m.get("provenance_path", [])],
                    suggested_evidence=[e.get("evidence_type", "") for e in m.get("evidence_items", [])],
                    deadline=m["deadline"],
                    priority_score=m.get("priority_score", 50),
                    risk_level=m.get("risk_level", "medium"),
                    clause_text=m.get("clause_text", ""),
                    circular_id=m["circular_id"],
                    routing="pending_review",
                    gap_status="confirmed",
                )
            )

    actions: list[TriageAction] = []
    act_cursor = database.triage_actions.find().sort("timestamp", -1).limit(10)
    async for a in act_cursor:
        actions.append(
            TriageAction(
                action_id=a.get("action_id", str(a.get("_id", ""))),
                map_id=a.get("map_id"),
                gap_id=a.get("gap_id"),
                timestamp=a["timestamp"],
                officer_name=a.get("officer_name", "Unknown"),
                decision=a.get("decision", "unknown"),
                title=a.get("title"),
            )
        )

    total_maps = await database.maps.count_documents({})
    pending_count = len(pending_review)
    auto_count = len(auto_routed)

    return TriageDashboardResponse(
        stats={
            "total_maps": total_maps,
            "auto_routed": auto_count,
            "pending_review": pending_count,
            "processed_today": sum(
                1 for a in actions
                if a.timestamp.date() == datetime.utcnow().date()
            ),
            "avg_confidence": round(
                sum(c.confidence_score for c in auto_routed + pending_review)
                / max(1, auto_count + pending_count),
                2,
            ),
        },
        auto_routed=auto_routed,
        pending_review=pending_review,
        recently_processed=actions,
    )


@router.post("/bulk-approve")
async def bulk_approve_maps(body: MapBulkApproveBody):
    database = get_db()
    approved = []
    for map_id in body.map_ids:
        m = await database.maps.find_one({"map_id": map_id})
        if not m:
            continue
        now = datetime.utcnow()
        await database.maps.update_one(
            {"map_id": map_id},
            {
                "$set": {
                    "status": "approved",
                    "approved_at": now,
                    "timeline": build_timeline("approved", m.get("created_at", now), now),
                }
            },
        )
        await log_audit(
            database, map_id, body.officer_id, body.officer_name,
            "map_bulk_approved", "Bulk approval from triage dashboard"
        )
        if m.get("gap_id"):
            await database.gap_queue.update_one(
                {"gap_id": m["gap_id"]},
                {"$set": {"triage_status": "resolved"}},
            )
        approved.append(map_id)
    return {"approved": approved, "count": len(approved)}


@router.get("", response_model=MapListResponse)
async def list_maps(
    status: Optional[str] = None,
    department: Optional[str] = None,
    assignee: Optional[str] = None,
    risk_level: Optional[str] = None,
    overdue: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort: str = "priority",
):
    database = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if department:
        query["owner_department_id"] = department
    if assignee:
        query["assigned_to"] = assignee
    if risk_level:
        query["risk_level"] = risk_level
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = datetime.fromisoformat(date_from)
        if date_to:
            query["created_at"]["$lte"] = datetime.fromisoformat(date_to)

    if overdue:
        query["deadline"] = {"$lt": datetime.utcnow()}
        query["status"] = {"$nin": ["complete", "rejected", "published"]}

    total = await database.maps.count_documents(query)
    sort_key = [("priority_score", -1), ("deadline", 1)] if sort == "priority" else [("deadline", 1)]

    skip = (page - 1) * page_size
    cursor = database.maps.find(query).sort(sort_key).skip(skip).limit(page_size)

    items: list[MapListItem] = []
    async for m in cursor:
        deadline = m["deadline"]
        days = _days_until(deadline)
        items.append(
            MapListItem(
                map_id=m["map_id"],
                title=m.get("title", "Untitled"),
                status=m.get("status", "draft"),
                owner_department_id=m["owner_department_id"],
                department_name=m.get("department_name"),
                assigned_to=m.get("assigned_to"),
                assignee_name=m.get("assignee_name"),
                deadline=deadline,
                priority_score=m.get("priority_score", 50),
                risk_level=m.get("risk_level", "medium"),
                circular_id=m["circular_id"],
                gap_id=m.get("gap_id"),
                evidence_completion_pct=_evidence_pct(m.get("evidence_items", [])),
                days_until_deadline=days,
                is_overdue=days < 0 and m.get("status") not in ("complete", "rejected"),
                created_at=m.get("created_at"),
            )
        )

    return MapListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/export")
async def export_maps(format: str = "json"):
    database = get_db()
    cursor = database.maps.find({}).sort([("priority_score", -1)])
    rows = []
    async for m in cursor:
        m.pop("_id", None)
        for k, v in list(m.items()):
            if isinstance(v, datetime):
                m[k] = v.isoformat()
        rows.append(m)

    if format == "csv":
        if not rows:
            return JSONResponse(content="map_id,title,status,department,deadline,priority\n")
        headers = ["map_id", "title", "status", "owner_department_id", "deadline", "priority_score", "risk_level"]
        lines = [",".join(headers)]
        for r in rows:
            lines.append(",".join(
                str(r.get(h, "")).replace(",", ";") for h in headers
            ))
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse("\n".join(lines), media_type="text/csv")

    return {"maps": rows, "count": len(rows)}


@router.get("/{map_id}", response_model=MapDetailResponse)
async def get_map(map_id: str):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(status_code=404, detail="MAP not found")
    return _map_to_detail(m)


@router.post("/{map_id}/approve")
async def approve_map(map_id: str, body: MapApproveBody):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(status_code=404, detail="MAP not found")

    now = datetime.utcnow()
    updates: dict = {
        "status": "approved",
        "approved_at": now,
    }
    if body.department_id:
        updates["owner_department_id"] = body.department_id
    if body.deadline:
        updates["deadline"] = body.deadline
    if body.risk_level:
        updates["risk_level"] = body.risk_level
    if body.title:
        updates["title"] = body.title
    if body.description:
        updates["description"] = body.description
    if body.evidence_types:
        updates["evidence_items"] = [
            {"evidence_type": t, "label": t.replace("_", " ").title(), "required": True, "uploaded": False}
            for t in body.evidence_types
        ]

    updates["timeline"] = build_timeline("approved", m.get("created_at", now), now)
    await database.maps.update_one({"map_id": map_id}, {"$set": updates})
    await log_audit(
        database, map_id, body.officer_id, body.officer_name,
        "map_approved", body.notes or "MAP approved — routing module triggered"
    )

    if m.get("gap_id"):
        await database.gap_queue.update_one(
            {"gap_id": m["gap_id"]},
            {"$set": {"triage_status": "resolved", "generated_map_id": map_id}},
        )

  # Routing module placeholder — status moves to open for assignee workflow
    await database.maps.update_one({"map_id": map_id}, {"$set": {"status": "open"}})

    return {"status": "approved", "map_id": map_id, "routing": "triggered"}


@router.post("/{map_id}/reject")
async def reject_map(map_id: str, body: MapRejectBody):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(status_code=404, detail="MAP not found")

    now = datetime.utcnow()
    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"status": "rejected", "reject_reason": body.reason}},
    )
    await log_audit(
        database, map_id, body.officer_id, body.officer_name,
        "map_rejected", body.reason
    )

    if m.get("gap_id"):
        await database.gap_queue.update_one(
            {"gap_id": m["gap_id"]},
            {"$set": {"triage_status": "dismissed", "dismiss_reason": body.reason}},
        )

    return {"status": "rejected", "map_id": map_id}


@router.post("/{map_id}/extend")
async def extend_deadline(map_id: str, body: MapExtendBody):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(status_code=404, detail="MAP not found")

    current_deadline = m["deadline"]
    if isinstance(current_deadline, str):
        current_deadline = datetime.fromisoformat(current_deadline.replace("Z", ""))
    days_left = (current_deadline - datetime.utcnow()).days
    if days_left < 7:
        # Extension within 7 days requires approver record
        pass

    await database.maps.update_one(
        {"map_id": map_id},
        {
            "$set": {"deadline": body.new_deadline},
            "$push": {
                "deadline_extensions": {
                    "new_deadline": body.new_deadline,
                    "reason": body.reason,
                    "approver_id": body.approver_id,
                    "approved_at": datetime.utcnow(),
                }
            },
        },
    )
    await log_audit(
        database, map_id, body.approver_id, body.approver_name,
        "deadline_extended", body.reason
    )
    return {"status": "extended", "map_id": map_id, "new_deadline": body.new_deadline.isoformat()}


@router.post("/{map_id}/escalate")
async def escalate_map(map_id: str, body: MapEscalateBody):
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(status_code=404, detail="MAP not found")

    new_id = f"MAP-{uuid.uuid4().hex[:8].upper()}"
    new_deadline = datetime.utcnow() + timedelta(days=body.new_deadline_days)

    escalated = {
        **{k: v for k, v in m.items() if k != "_id"},
        "map_id": new_id,
        "parent_map_id": map_id,
        "status": "escalated",
        "deadline": new_deadline,
        "escalation_status": "active",
        "escalation_reason": body.reason,
        "created_at": datetime.utcnow(),
        "priority_score": min(100, m.get("priority_score", 50) + 15),
    }
    await database.maps.insert_one(escalated)

    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"status": "escalated", "escalation_status": "superseded", "child_map_id": new_id}},
    )
    await log_audit(
        database, map_id, body.officer_id, body.officer_name,
        "map_escalated", f"Escalated to {new_id}: {body.reason}"
    )

    return {"status": "escalated", "original_map_id": map_id, "escalated_map_id": new_id}


class MapBulkReassignBody(BaseModel):
    map_ids: list[str]
    assignee: str
    department: Optional[str] = None


@router.post("/bulk-reassign")
async def bulk_reassign(body: MapBulkReassignBody):
    database = get_db()
    update = {"assigned_to": body.assignee}
    if body.department:
        update["owner_department_id"] = body.department
    result = await database.maps.update_many(
        {"map_id": {"$in": body.map_ids}},
        {"$set": update},
    )
    return {"modified": result.modified_count}


# ─── RBAC: Assign MAP to employee ────────────────────────────────────────────

ADMIN_ROLES = {"admin", "compliance_officer", "department_head"}

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class AssignBody(BaseModel):
    emp_id: str
    emp_name: Optional[str] = None


class CompleteBody(BaseModel):
    emp_id: str


@router.patch("/{map_id}/assign")
async def assign_map(
    map_id: str,
    body: AssignBody,
    current_user: dict = Depends(get_current_user),
):
    """Admin/Compliance Officer assigns a MAP to an employee."""
    if current_user.get("role") not in ADMIN_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")

    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    name = body.emp_name
    if not name:
        u = await database.users.find_one({"emp_id": body.emp_id})
        name = u.get("name", body.emp_id) if u else body.emp_id

    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {
            "assigned_to": body.emp_id,
            "assignee_name": name,
            "status": "in_progress",
        }},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Officer"),
        "map_assigned",
        f"MAP assigned to {name} ({body.emp_id})",
    )
    return {"status": "assigned", "map_id": map_id, "assigned_to": body.emp_id, "assignee_name": name}


@router.patch("/{map_id}/complete")
async def complete_map(
    map_id: str,
    body: CompleteBody,
    current_user: dict = Depends(get_current_user),
):
    """Assigned employee marks the MAP as complete."""
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    role = current_user.get("role", "")
    if role not in ADMIN_ROLES and m.get("assigned_to") != current_user["emp_id"]:
        raise HTTPException(403, "You are not assigned to this MAP")

    evidence = m.get("evidence_items", [])
    missing = [e["label"] for e in evidence if e.get("required") and not e.get("uploaded")]
    if missing:
        raise HTTPException(400, f"Upload required evidence first: {', '.join(missing)}")

    now = datetime.utcnow()
    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {
            "status": "pending_validation",
            "submitted_for_validation_at": now,
            "timeline": build_timeline("pending_validation", m.get("created_at", now), now),
        }},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Employee"),
        "map_submitted_for_validation",
        "Task submitted for evidence validation",
    )
    return {"status": "pending_validation", "map_id": map_id}


@router.post("/{map_id}/route")
async def route_map_endpoint(map_id: str):
    """Assign department, employee (lowest workload), and escalation chain."""
    from services.routing_service import route_map

    database = get_db()
    try:
        return await route_map(database, map_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{map_id}/evidence/{evidence_index}")
async def upload_evidence(
    map_id: str,
    evidence_index: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload proof file for a specific evidence item."""
    database = get_db()
    m = await database.maps.find_one({"map_id": map_id})
    if not m:
        raise HTTPException(404, "MAP not found")

    role = current_user.get("role", "")
    if role not in ADMIN_ROLES and m.get("assigned_to") != current_user["emp_id"]:
        raise HTTPException(403, "You are not assigned to this MAP")

    evidence = m.get("evidence_items", [])
    if evidence_index < 0 or evidence_index >= len(evidence):
        raise HTTPException(400, f"Invalid evidence index {evidence_index}")

    ext = os.path.splitext(file.filename or "proof")[1] or ".bin"
    filename = f"{map_id}_ev{evidence_index}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(filepath, "wb") as f_out:
        f_out.write(contents)

    evidence[evidence_index]["uploaded"] = True
    evidence[evidence_index]["file_url"] = f"/uploads/{filename}"
    evidence[evidence_index]["uploaded_at"] = datetime.utcnow().isoformat()

    await database.maps.update_one(
        {"map_id": map_id},
        {"$set": {"evidence_items": evidence}},
    )
    await log_audit(
        database, map_id,
        current_user["emp_id"], current_user.get("name", "Employee"),
        "evidence_uploaded",
        f"Uploaded proof for evidence item {evidence_index}: {file.filename}",
    )
    return {
        "status": "uploaded",
        "map_id": map_id,
        "evidence_index": evidence_index,
        "file_url": f"/uploads/{filename}",
    }

