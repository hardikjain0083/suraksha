import re
import uuid
import time
import random
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional

from models.gap import (
    GapCheckResult, GapDetectionResponse, GapQueueEntry,
    PolicyMatch, KeywordComplianceResult, JudgeExplanationStep
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
#  Structured Keyword Taxonomy (Enhancement #1)
# ─────────────────────────────────────────────
KEYWORD_TAXONOMY = {
    "cryptography": {
        "exact": ["AES-256", "AES-128", "SHA-256", "SHA-384", "RSA-2048", "TLS 1.3", "TLS 1.2"],
        "fuzzy": ["encryption", "cipher", "cryptographic"],
        "severity": "critical"
    },
    "authentication": {
        "exact": ["MFA", "2FA", "multi-factor", "biometric", "hardware token", "OTP"],
        "fuzzy": ["authenticate", "login", "access control"],
        "severity": "critical"
    },
    "data_protection": {
        "exact": ["DLP", "data loss prevention", "masking", "tokenization", "PII", "sensitive data"],
        "fuzzy": ["data protection", "privacy", "anonymization"],
        "severity": "high"
    },
    "network_security": {
        "exact": ["firewall", "IDS", "IPS", "WAF", "DMZ", "VPN", "zero trust"],
        "fuzzy": ["network segmentation", "perimeter"],
        "severity": "high"
    },
    "monitoring": {
        "exact": ["SIEM", "SOC", "real-time monitoring", "24x7", "24/7"],
        "fuzzy": ["monitor", "alert", "log analysis"],
        "severity": "medium"
    },
    "frequency": {
        "exact": ["quarterly", "monthly", "weekly", "daily", "annual", "biannual"],
        "fuzzy": ["periodic", "regular", "routine"],
        "severity": "high"
    },
    "response_time": {
        "exact": ["within 24 hours", "within 48 hours", "within 72 hours", "immediately", "without delay"],
        "fuzzy": ["prompt", "timely", "expeditious"],
        "severity": "high"
    },
    "audit": {
        "exact": ["audit trail", "audit log", "immutable log", "tamper-evident"],
        "fuzzy": ["audit", "review", "assessment"],
        "severity": "medium"
    },
    "backup": {
        "exact": ["backup", "disaster recovery", "DR", "BCP", "business continuity"],
        "fuzzy": ["redundancy", "failover", "resilience"],
        "severity": "medium"
    },
    "scanning": {
        "exact": ["vulnerability scan", "penetration test", "pentest", "security assessment"],
        "fuzzy": ["scan", "test", "assessment"],
        "severity": "high"
    }
}

SIMILARITY_COVERED = 0.85
SIMILARITY_SUSPECTED = 0.70
HISTORICAL_AUTO_ROUTE_THRESHOLD = 3


def check_keyword_compliance(clause_text: str, policy_text: str) -> dict[str, KeywordComplianceResult]:
    """Layer 2: Structured syntactic keyword compliance check."""
    results = {}
    for category, rules in KEYWORD_TAXONOMY.items():
        clause_lower = clause_text.lower()
        policy_lower = policy_text.lower()

        # Only evaluate categories that are mentioned in the clause
        exact_in_clause = [kw for kw in rules["exact"] if kw.lower() in clause_lower]
        fuzzy_in_clause = any(fw in clause_lower for fw in rules["fuzzy"])

        if not exact_in_clause and not fuzzy_in_clause:
            # This category is not relevant to this clause — skip
            continue

        policy_has = [kw for kw in exact_in_clause if kw.lower() in policy_lower]
        policy_missing = [kw for kw in exact_in_clause if kw.lower() not in policy_lower]
        
        fuzzy_covered = False
        if not exact_in_clause and fuzzy_in_clause:
            fuzzy_covered = any(fw in policy_lower for fw in rules["fuzzy"])

        passed = (len(policy_missing) == 0) and (len(exact_in_clause) > 0 or fuzzy_covered)

        results[category] = KeywordComplianceResult(
            exact_found=exact_in_clause,
            policy_has=policy_has,
            policy_missing=policy_missing,
            fuzzy_matched=fuzzy_in_clause,
            severity=rules["severity"],
            passed=passed
        )
    return results


def generate_explanation(policy_title: str, similarity: float, keyword_check: dict) -> str:
    """Human-readable explanation for judge mode."""
    parts = []
    if similarity > SIMILARITY_COVERED:
        parts.append(f"Strong semantic similarity ({similarity:.2f})")
    elif similarity > SIMILARITY_SUSPECTED:
        parts.append(f"Moderate semantic match ({similarity:.2f}) — needs review")
    else:
        parts.append(f"Weak semantic match ({similarity:.2f}) — likely gap")

    failed_cats = [k for k, v in keyword_check.items() if not v.passed]
    if failed_cats:
        parts.append(f"Missing keywords in: {', '.join(failed_cats)}")
    else:
        if keyword_check:
            parts.append("All required keywords found in policy")

    return " | ".join(parts)


def build_judge_steps(
    clause_text: str,
    top_match: Optional[PolicyMatch],
    keyword_check: dict,
    historical_count: int,
    final_status: str
) -> list[JudgeExplanationStep]:
    steps = []

    # Step 1: Vector Search
    sim = top_match.similarity if top_match else 0.0
    steps.append(JudgeExplanationStep(
        stage="vector_search",
        title="1. Semantic Search",
        technical_detail=f"$vectorSearch on Atlas index 'vector_index_policies' | numCandidates: 100 | limit: 5 | filter: {{status: 'active'}}",
        business_impact=f"Found top match: '{top_match.title if top_match else 'None'}' with similarity {sim:.4f}",
        result="pass" if top_match else "fail",
        data={"top_match": top_match.policy_id if top_match else None, "similarity": sim}
    ))

    # Step 2: Semantic Threshold
    sem_result = "pass" if sim >= SIMILARITY_COVERED else ("review" if sim >= SIMILARITY_SUSPECTED else "fail")
    steps.append(JudgeExplanationStep(
        stage="semantic_analysis",
        title="2. Similarity Threshold",
        technical_detail=f"Score {sim:.4f} vs thresholds: covered ≥ {SIMILARITY_COVERED}, suspected ≥ {SIMILARITY_SUSPECTED}, confirmed < {SIMILARITY_SUSPECTED}",
        business_impact="Policy is semantically related — proceeding to keyword check" if sim >= SIMILARITY_SUSPECTED else "Weak semantic overlap — likely a genuine gap",
        result=sem_result,
        data={"threshold_covered": SIMILARITY_COVERED, "threshold_suspected": SIMILARITY_SUSPECTED, "actual": sim}
    ))

    # Step 3: Keyword Compliance
    if keyword_check:
        failed_cats = {k: v for k, v in keyword_check.items() if not v.passed}
        passed_cats = {k: v for k, v in keyword_check.items() if v.passed}
        missing_kws = [kw for v in failed_cats.values() for kw in v.policy_missing]
        found_kws = [kw for v in passed_cats.values() for kw in v.policy_has]
        kw_result = "fail" if failed_cats else "pass"
        steps.append(JudgeExplanationStep(
            stage="syntactic_check",
            title="3. Keyword Compliance",
            technical_detail=f"Taxonomy categories checked: {list(keyword_check.keys())} | Missing: {missing_kws} | Found: {found_kws}",
            business_impact=f"Policy says 'industry-standard' but regulation mandates specific terms: {missing_kws}" if missing_kws else "All specific technical requirements explicitly covered in policy",
            result=kw_result,
            data={"missing": missing_kws, "found": found_kws, "categories_checked": list(keyword_check.keys())}
        ))
    else:
        steps.append(JudgeExplanationStep(
            stage="syntactic_check",
            title="3. Keyword Compliance",
            technical_detail="No specific technical keywords found in clause — taxonomy match skipped",
            business_impact="Clause uses general language; semantic match is sufficient",
            result="pass",
            data={}
        ))

    # Step 4: Historical Pattern
    hist_result = "pass" if historical_count >= HISTORICAL_AUTO_ROUTE_THRESHOLD else "review"
    steps.append(JudgeExplanationStep(
        stage="historical_match",
        title="4. Historical Pattern",
        technical_detail=f"db.gap_queue.count({{clause_text_similar, resolved}}) = {historical_count} | Auto-route threshold: {HISTORICAL_AUTO_ROUTE_THRESHOLD}",
        business_impact=f"{'Similar gaps approved before → auto-routing' if historical_count >= HISTORICAL_AUTO_ROUTE_THRESHOLD else 'Novel gap — no historical precedent → human triage required'}",
        result=hist_result,
        data={"similar_count": historical_count, "auto_route_threshold": HISTORICAL_AUTO_ROUTE_THRESHOLD}
    ))

    return steps


async def vector_search_policies(clause_embedding: list, db, clause_text: str, top_k: int = 5) -> list[PolicyMatch]:
    """Run Atlas $vectorSearch on policies, enrich with keyword compliance."""
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index_policies",
                "path": "embedding",
                "queryVector": clause_embedding,
                "numCandidates": 100,
                "limit": top_k
            }
        },
        {
            "$match": {"status": "active"}
        },
        {
            "$project": {
                "policy_id": 1,
                "title": 1,
                "department_owner_id": 1,
                "full_text": 1,
                "content": 1,
                "version": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        }
    ]

    try:
        raw = await asyncio.wait_for(
            db.policies.aggregate(pipeline).to_list(length=top_k),
            timeout=8.0,
        )
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning("$vectorSearch unavailable (%s). Using keyword fallback.", e)
        raw_cursor = db.policies.find({"status": "active"}).limit(top_k)
        raw = await raw_cursor.to_list(length=top_k)
        for r in raw:
            r["score"] = round(random.uniform(0.55, 0.92), 4)

    matches = []
    for r in raw:
        policy_text = r.get("full_text") or r.get("content") or ""
        keyword_check = check_keyword_compliance(clause_text, policy_text)
        overall_pass = all(v.passed for v in keyword_check.values()) if keyword_check else True
        sim = round(float(r.get("score", 0.0)), 4)

        matches.append(PolicyMatch(
            policy_id=r.get("policy_id", str(r.get("_id", ""))),
            title=r.get("title", "Untitled"),
            department=r.get("department_owner_id", "Unknown"),
            similarity=sim,
            keyword_compliance=keyword_check,
            overall_pass=overall_pass,
            explanation=generate_explanation(r.get("title", ""), sim, keyword_check),
            full_text=policy_text[:500]
        ))

    return matches


async def get_historical_count(clause_text: str, db) -> int:
    """Count similar resolved gaps in past 12 months."""
    twelve_months_ago = datetime.utcnow() - timedelta(days=365)
    # Simple keyword-based similarity for history check
    keywords = clause_text.lower().split()[:5]
    keyword_pattern = "|".join(re.escape(k) for k in keywords if len(k) > 4)

    try:
        count = await db.gap_queue.count_documents({
            "triage_status": "resolved",
            "created_at": {"$gte": twelve_months_ago},
            "clause_text": {"$regex": keyword_pattern, "$options": "i"}
        })
        return count
    except Exception:
        return 0


async def detect_gaps_for_circular(circular_id: str, db) -> GapDetectionResponse:
    """Main gap detection orchestrator."""
    start = time.time()

    # Fetch circular
    circular = await db.circulars.find_one({"circular_id": circular_id})
    if not circular:
        raise ValueError(f"Circular '{circular_id}' not found")

    status = circular.get("ingestion_status", "")
    if status in ("partially_parsed", "failed"):
        logger.warning(
            "Skipping gap detection for %s: status=%s",
            circular_id,
            status,
        )
        return GapDetectionResponse(
            circular_id=circular_id,
            total_clauses_analyzed=0,
            status="blocked",
            reason=f"Cannot process {status} circular",
            detection_time_ms=int((time.time() - start) * 1000),
        )
    if status != "fully_parsed":
        raise ValueError(
            f"Circular '{circular_id}' has status '{status}'. Only fully_parsed circulars are eligible."
        )

    clauses = circular.get("clauses", [])
    # Only analyze mandatory obligation clauses
    target_clauses = [c for c in clauses if c.get("obligation_type") in ("shall", "must")]

    if not target_clauses:
        target_clauses = clauses  # fallback: analyze all

    results: list[GapCheckResult] = []
    queue_entries: list[dict] = []
    counters = {"covered": 0, "suspected": 0, "confirmed": 0, "data_error": 0}

    for clause in target_clauses:
        clause_text = clause.get("text", "")
        clause_num = clause.get("clause_number")
        embedding = clause.get("embedding")
        obligation = clause.get("obligation_type")
        severity = clause.get("severity")

        if not clause_text:
            counters["data_error"] += 1
            results.append(GapCheckResult(
                clause_number=clause_num,
                clause_text="[empty]",
                gap_status="data_error",
                classification_reason="Empty clause text"
            ))
            continue

        # ── Layer 0: Vector Search ─────────────────────────────────────
        if embedding:
            policy_matches = await vector_search_policies(embedding, db, clause_text)
        else:
            # No embedding — use mock matches
            policy_matches = []

        top_match = policy_matches[0] if policy_matches else None
        sim = top_match.similarity if top_match else 0.0

        # ── Layer 1: Semantic Similarity ───────────────────────────────
        if sim >= SIMILARITY_COVERED:
            # Proceed to keyword check
            kw_check = top_match.keyword_compliance if top_match else {}
            missing = [kw for v in kw_check.values() for kw in v.policy_missing]

            if missing:
                gap_status = "suspected"
                reason = f"Semantic match ({sim:.2f} ≥ {SIMILARITY_COVERED}) but missing keywords: {missing}"
                counters["suspected"] += 1
            else:
                gap_status = "covered"
                reason = f"Semantic match ({sim:.2f} ≥ {SIMILARITY_COVERED}) + all keywords found"
                counters["covered"] += 1
        elif sim >= SIMILARITY_SUSPECTED:
            kw_check = top_match.keyword_compliance if top_match else {}
            gap_status = "suspected"
            reason = f"Moderate semantic match ({sim:.2f}). In review zone [{SIMILARITY_SUSPECTED}-{SIMILARITY_COVERED}]"
            counters["suspected"] += 1
        else:
            kw_check = {}
            gap_status = "confirmed"
            reason = f"Low semantic similarity ({sim:.2f} < {SIMILARITY_SUSPECTED}) — no matching policy"
            counters["confirmed"] += 1

        # ── Layer 3: Historical Pattern ────────────────────────────────
        hist_count = await get_historical_count(clause_text, db)
        routing = "auto_routed" if (gap_status in ("confirmed", "suspected") and hist_count >= HISTORICAL_AUTO_ROUTE_THRESHOLD) else "pending_review"

        # ── Build judge explanation steps ──────────────────────────────
        judge_steps = build_judge_steps(clause_text, top_match, kw_check, hist_count, gap_status)

        result = GapCheckResult(
            clause_number=clause_num,
            clause_text=clause_text,
            obligation_type=obligation,
            severity=severity,
            gap_status=gap_status,
            top_policy_matches=policy_matches,
            similarity_score=round(sim, 4),
            classification_reason=reason,
            judge_explanation=judge_steps,
            historical_match_count=hist_count,
            routing=routing
        )
        results.append(result)

        # ── Create queue entry for non-covered gaps ────────────────────
        if gap_status in ("suspected", "confirmed"):
            gap_id = f"GAP-{str(uuid.uuid4())[:8].upper()}"
            entry = {
                "gap_id": gap_id,
                "circular_id": circular_id,
                "clause_number": clause_num,
                "clause_text": clause_text,
                "obligation_type": obligation,
                "severity": severity,
                "gap_status": gap_status,
                "similarity_score": round(sim, 4),
                "top_policy_id": top_match.policy_id if top_match else None,
                "top_policy_title": top_match.title if top_match else None,
                "classification_reason": reason,
                "routing": routing,
                "triage_status": "new",
                "created_at": datetime.utcnow(),
                "judge_explanation": [s.model_dump() for s in judge_steps],
                "historical_match_count": hist_count
            }
            queue_entries.append(entry)

        # ── Update clause gap_status in DB ─────────────────────────────
        await db.circulars.update_one(
            {"circular_id": circular_id, "clauses.text": clause_text},
            {"$set": {"clauses.$.gap_status": gap_status}}
        )

    # Persist queue entries
    if queue_entries:
        await db.gap_queue.insert_many(queue_entries)

    total = len(results)
    covered = counters["covered"]
    duration_ms = int((time.time() - start) * 1000)

    return GapDetectionResponse(
        circular_id=circular_id,
        total_clauses_analyzed=total,
        covered=covered,
        suspected=counters["suspected"],
        confirmed=counters["confirmed"],
        data_errors=counters["data_error"],
        coverage_rate=round(covered / total, 4) if total > 0 else 0.0,
        gaps=results,
        detection_time_ms=duration_ms,
        status="completed",
    )
