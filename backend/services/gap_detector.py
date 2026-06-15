import re
import uuid
import time
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from models.gap import GapCheckResult, GapDetectionResponse, GapQueueEntry, PolicyMatch, JudgeExplanationStep
from sklearn.feature_extraction.text import TfidfVectorizer
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD_MATCH = 0.75
SIMILARITY_THRESHOLD_PARTIAL = 0.65
SIMILARITY_THRESHOLD_CLAUSE = 0.60

# ─────────────────────────────────────────────────────────────
#  Keyword Extractor (Custom RAKE implementation)
# ─────────────────────────────────────────────────────────────

class RakeKeywordExtractor:
    def __init__(self):
        self.stopwords = {
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", 
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", 
            "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", 
            "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", 
            "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", 
            "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", 
            "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", 
            "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", 
            "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", 
            "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", 
            "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", 
            "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", 
            "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", 
            "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", 
            "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
            "bank", "banks", "banking", "circular", "circulars", "rbi", "section", "annexure", "annexures", 
            "herein", "thereof", "pursuant", "notwithstanding", "guidelines", "guideline", "direction", "directions",
            "regulatory", "compliance"
        }

    def _is_number(self, s):
        try:
            float(s)
            return True
        except ValueError:
            return False

    def extract_keywords(self, text: str) -> List[str]:
        if not text.strip():
            return []
        sentences = re.split(r'[,.!?;:\t\-\[\]\(\)\"\']', text.lower())
        phrases = []
        for s in sentences:
            words = s.strip().split()
            phrase = []
            for w in words:
                w_clean = re.sub(r'[^a-z0-9]', '', w)
                if w_clean in self.stopwords or self._is_number(w_clean) or len(w_clean) <= 2:
                    if phrase:
                        phrases.append(phrase)
                        phrase = []
                else:
                    phrase.append(w_clean)
            if phrase:
                phrases.append(phrase)
                
        word_freq = {}
        word_degree = {}
        for phrase in phrases:
            degree = len(phrase) - 1
            for word in phrase:
                word_freq[word] = word_freq.get(word, 0) + 1
                word_degree[word] = word_degree.get(word, 0) + degree
                
        for word in word_freq:
            word_degree[word] = word_degree[word] + word_freq[word]
            
        word_scores = {}
        for word in word_freq:
            word_scores[word] = word_degree[word] / word_freq[word]
            
        phrase_scores = {}
        for phrase in phrases:
            phrase_str = " ".join(phrase)
            score = 0
            for word in phrase:
                score += word_scores.get(word, 0)
            phrase_scores[phrase_str] = score
            
        sorted_phrases = sorted(phrase_scores.items(), key=lambda x: x[1], reverse=True)
        return [p[0] for p in sorted_phrases if p[0].strip()][:10]

# ─────────────────────────────────────────────────────────────
#  NLP Helper Functions
# ─────────────────────────────────────────────────────────────

def preprocess_text(text: str) -> List[str]:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    stopwords = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", 
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", 
        "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", 
        "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", 
        "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", 
        "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", 
        "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", 
        "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", 
        "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", 
        "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", 
        "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", 
        "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", 
        "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", 
        "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", 
        "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
        "bank", "banks", "banking", "circular", "circulars", "rbi", "section", "annexure", "herein", "thereof", 
        "pursuant", "notwithstanding", "guidelines", "guideline", "direction", "directions", "regulatory", "compliance"
    }
    words = text.split()
    tokens = []
    for w in words:
        if w in stopwords or len(w) <= 2:
            continue
        if w.endswith("ies") and not w.endswith("eies"):
            w = w[:-3] + "y"
        elif w.endswith("es") and not w.endswith("aes") and not w.endswith("ees") and not w.endswith("oes"):
            w = w[:-2]
        elif w.endswith("s") and not w.endswith("ss") and not w.endswith("us") and not w.endswith("is") and not w.endswith("as"):
            w = w[:-1]
        elif w.endswith("ing"):
            w = w[:-3]
        elif w.endswith("ed"):
            w = w[:-2]
        tokens.append(w)
    return tokens

def calculate_jaccard(set1: set, set2: set) -> float:
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union

def calculate_tfidf_cosine(text1: str, text2: str) -> float:
    try:
        vectorizer = TfidfVectorizer(tokenizer=preprocess_text, lowercase=True)
        tfidf = vectorizer.fit_transform([text1, text2])
        dot_prod = (tfidf[0] * tfidf[1].T).toarray()[0][0]
        return float(dot_prod)
    except Exception:
        return 0.0

def calculate_fuzzy_ratio(text1: str, text2: str) -> float:
    return SequenceMatcher(None, text1, text2).ratio()

def calculate_weighted_score(text1: str, text2: str, kws1: Any, kws2: Any) -> float:
    tfidf_sim = calculate_tfidf_cosine(text1, text2)
    jaccard_sim = calculate_jaccard(set(kws1), set(kws2))
    fuzzy_sim = calculate_fuzzy_ratio(text1, text2)
    return 0.4 * tfidf_sim + 0.3 * jaccard_sim + 0.3 * fuzzy_sim


def normalize_guideline(text: str) -> str:
    text = re.sub(r'Circular No\.\s*[A-Z0-9\-/]+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'dated\s+[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}', '', text, flags=re.IGNORECASE)
    text = re.sub(r'page\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip().lower()
    return text

def compute_substance_hash(text: str) -> str:
    normalized = normalize_guideline(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

# ─────────────────────────────────────────────────────────────
#  Severity & Applicability
# ─────────────────────────────────────────────────────────────

def parse_severity_and_deadline(text: str) -> tuple[str, int]:
    severity = "medium"
    days = 14
    lower_text = text.lower()
    
    if "with immediate effect" in lower_text or "effective from date of circular" in lower_text:
        severity = "critical"
        days = 3
    elif "within 30 days" in lower_text or "compliance within 30 days" in lower_text:
        severity = "critical"
        days = 30
    elif "within 90 days" in lower_text or "quarterly" in lower_text:
        severity = "high"
        days = 90
    elif "within 180 days" in lower_text or "may consider" in lower_text or "advised" in lower_text:
        severity = "low"
        days = 180
    elif "within 1 year" in lower_text or "annual" in lower_text:
        severity = "medium"
        days = 365
        
    if severity == "medium":
        if "shall" in lower_text or "must" in lower_text or "directed to" in lower_text:
            severity = "critical"
            days = 30
        elif "should" in lower_text or "maintain" in lower_text:
            severity = "high"
            days = 90
        elif "may" in lower_text or "recommended" in lower_text:
            severity = "low"
            days = 180
            
    return severity, days

# ─────────────────────────────────────────────────────────────
#  Routing Disambiguation
# ─────────────────────────────────────────────────────────────

DEPT_KEYWORDS = {
    "DEPT-COMPLIANCE": ["kyc", "aml", "cft", "pmla", "customer identification", "due diligence", "suspicious transaction", "str"],
    "DEPT-IT-CYBER": ["cybersecurity", "information security", "firewall", "encryption", "access control", "vulnerability", "penetration testing", "iso 27001", "mfa", "multi-factor authentication", "authentication", "login", "password"],
    "DEPT-RISK": ["npa", "capital adequacy", "crar", "stress testing", "credit risk", "market risk", "operational risk", "basel"],
    "DEPT-FINANCE": ["capital", "dividend", "reserves", "provisioning", "npa classification", "income recognition", "asset classification"],
    "DEPT-OPS": ["customer grievance", "ombudsman", "turnaround time", "tat", "service standards", "branch operations", "cash management"],
    "DEPT-SME-CREDIT": ["loan", "credit appraisal", "sanction", "disbursement", "collateral", "margin", "exposure limit", "concentration risk"],
    "DEPT-HR": ["fit and proper", "director", "board", "kmp", "remuneration", "training", "certification"]
}


def route_department(circular_number: str, text: str, category_tag: str = "") -> tuple[str, bool, List[str]]:
    from config import CIRCULAR_PREFIX_MAP
    prefix_match = None
    for prefix in CIRCULAR_PREFIX_MAP:
        if circular_number.startswith(prefix) or prefix in circular_number:
            prefix_match = CIRCULAR_PREFIX_MAP[prefix]
            break
            
    dept_hints = []
    if prefix_match:
        dept_hints = prefix_match["dept_hint"]
        
    name_to_id = {
        "Compliance": "DEPT-COMPLIANCE",
        "IT Security": "DEPT-IT-CYBER",
        "Risk Management": "DEPT-RISK",
        "Finance": "DEPT-FINANCE",
        "Operations": "DEPT-OPS",
        "Credit": "DEPT-SME-CREDIT",
        "HR": "DEPT-HR"
    }
    
    text_lower = text.lower()
    scores = {}
    for dept_id, kws in DEPT_KEYWORDS.items():
        score = sum(text_lower.count(kw) for kw in kws)
        friendly_name = next((name for name, d_id in name_to_id.items() if d_id == dept_id), None)
        if friendly_name and friendly_name in dept_hints:
            score += 10
        scores[dept_id] = score
        
    sorted_depts = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_dept_id, top_score = sorted_depts[0]
    second_dept_id, second_score = sorted_depts[1] if len(sorted_depts) > 1 else (None, 0)
    
    is_ambiguous = False
    ambiguous_departments = []
    
    if second_dept_id and top_score > 0:
        diff_pct = (top_score - second_score) / top_score
        if diff_pct < 0.10 or (top_score == second_score and top_score > 0):
            is_ambiguous = True
            ambiguous_departments = [top_dept_id, second_dept_id]
            
    return top_dept_id, is_ambiguous, ambiguous_departments

# ─────────────────────────────────────────────────────────────
#  Auto-Assignment with Availability Checks
# ─────────────────────────────────────────────────────────────

async def get_available_employee(db: Any, department_id: str) -> Optional[str]:
    employees_cursor = db.users.find({
        "department_id": department_id,
        "role": "employee",
        "status": "active"
    })
    employees = await employees_cursor.to_list(length=100)
    if not employees:
        return None

    # Filter by availability and caps
    available = [e for e in employees if e.get("availability_status", "available") == "available" and e.get("active_gap_count", 0) < e.get("max_concurrent_gaps", 5)]
    if not available:
        return None
        
    # Sort by active workload, then last assigned date
    available.sort(key=lambda e: (e.get("active_gap_count", 0), e.get("last_assigned_date") or datetime.min))
    return available[0]["emp_id"]

# ─────────────────────────────────────────────────────────────
#  Engine Core Detection Execution
# ─────────────────────────────────────────────────────────────

async def detect_gaps_for_circular(circular_id: str, db: Any) -> GapDetectionResponse:
    start = time.time()
    circular = await db.circulars.find_one({"circular_id": circular_id})
    if not circular:
        raise ValueError(f"Circular '{circular_id}' not found")
        
    if circular.get("ingestion_status") in ("not_applicable", "no_action_required"):
        return GapDetectionResponse(
            circular_id=circular_id,
            status="completed",
            reason=f"Ignored because ingestion status is {circular.get('ingestion_status')}"
        )

    title = circular.get("title", "Regulatory Circular")
    circular_num = circular.get("circular_number") or circular_id
    clauses = circular.get("clauses", [])
    
    # Analyze directives
    target_clauses = [c for c in clauses if c.get("obligation_type") in ("shall", "must", "should")]
    if not target_clauses:
        target_clauses = clauses

    # Fetch active policies
    today = datetime.utcnow()
    policies = await db.policies.find({
        "status": "active",
        "$or": [
            {"effective_until": None},
            {"effective_until": {"$gte": today}}
        ]
    }).to_list(length=100)

    rake = RakeKeywordExtractor()
    results = []
    queue_entries = []
    counters = {"covered": 0, "suspected": 0, "confirmed": 0, "data_error": 0}

    for clause in target_clauses:
        clause_text = clause.get("text", "")
        clause_num = clause.get("clause_number")
        page_num = clause.get("page_number", 1)
        
        if not clause_text.strip():
            counters["data_error"] += 1
            results.append(GapCheckResult(
                clause_number=clause_num,
                clause_text="[empty]",
                gap_status="data_error",
                classification_reason="Empty clause text"
            ))
            continue
            
        # RAKE Keyword Extraction
        clause_kws = set(rake.extract_keywords(clause_text))
        
        best_score = 0.0
        best_policy = None
        best_clause_text = None
        best_clause_page = 1
        matches_above_threshold = []
        
        for policy in policies:
            policy_text = policy.get("content", "")
            policy_id = policy["policy_id"]
            policy_title = policy.get("title", "")
            policy_clauses = policy.get("clauses", [])
            
            # If policy has structure-aware clauses
            if policy_clauses:
                for pc in policy_clauses:
                    pc_text = pc.get("text_content", "")
                    pc_kws = set(rake.extract_keywords(pc_text))
                    
                    # Score
                    score = calculate_weighted_score(clause_text, pc_text, clause_kws, pc_kws)
                    
                    if score > best_score:
                        best_score = score
                        best_policy = policy
                        best_clause_text = pc_text
                        best_clause_page = pc.get("page_number", 1)
                        
                    if score >= SIMILARITY_THRESHOLD_CLAUSE:
                        matches_above_threshold.append({
                            "policy_id": policy_id,
                            "policy_title": policy_title,
                            "clause_text": pc_text,
                            "page_number": pc.get("page_number", 1),
                            "score": score
                        })
            else:
                # Fallback to whole policy check
                pol_kws = set(rake.extract_keywords(policy_text))
                score = calculate_weighted_score(clause_text, policy_text, clause_kws, pol_kws)
                if score > best_score:
                    best_score = score
                    best_policy = policy
                    best_clause_text = policy_text[:300]
                    best_clause_page = 1
                    
                if score >= SIMILARITY_THRESHOLD_CLAUSE:
                    matches_above_threshold.append({
                        "policy_id": policy_id,
                        "policy_title": policy_title,
                        "clause_text": policy_text[:300],
                        "page_number": 1,
                        "score": score
                    })

        # Classify status & gaps
        gap_type = "missing_clause"
        gap_status = "confirmed"
        
        if best_score >= SIMILARITY_THRESHOLD_MATCH:
            # Check directives match
            directive_keyword_mismatch = False
            lower_clause = clause_text.lower()
            lower_policy = (best_clause_text or "").lower()
            if ("shall" in lower_clause or "must" in lower_clause) and ("may" in lower_policy or "consider" in lower_policy):
                directive_keyword_mismatch = True
                
            if directive_keyword_mismatch:
                gap_status = "confirmed"
                gap_type = "insufficient_clause"
                reason = f"Partial match found but directive is weaker than RBI requirement (overall score {best_score:.2f})."
                counters["confirmed"] += 1
            else:
                gap_status = "covered"
                reason = f"Complies with active policy: '{best_policy['title']}' (weighted score {best_score:.2f} >= {SIMILARITY_THRESHOLD_MATCH})"
                counters["covered"] += 1
        elif best_score >= SIMILARITY_THRESHOLD_PARTIAL:
            gap_status = "confirmed"
            gap_type = "insufficient_clause"
            reason = f"Policy exists but is weaker or deviates from RBI guidelines (weighted score {best_score:.2f})."
            counters["confirmed"] += 1
        else:
            gap_status = "confirmed"
            gap_type = "missing_clause"
            p_title = best_policy['title'] if best_policy else "None"
            reason = f"No matching compliance clause found. Highest match: '{p_title}' (weighted score {best_score:.2f} < {SIMILARITY_THRESHOLD_PARTIAL})"
            counters["confirmed"] += 1
            
        result = GapCheckResult(
            clause_number=clause_num,
            clause_text=clause_text,
            obligation_type=clause.get("obligation_type"),
            severity=clause.get("severity"),
            gap_status=gap_status,
            similarity_score=round(best_score, 4),
            classification_reason=reason
        )
        results.append(result)

        # Update circular clause status
        await db.circulars.update_one(
            {"circular_id": circular_id, "clauses.text": clause_text},
            {"$set": {"clauses.$.gap_status": gap_status}}
        )

        # Generate Gaps
        if gap_status == "confirmed":
            substance_hash = compute_substance_hash(clause_text)
            
            # Deduplication: check if already exists
            existing_gap = await db.gap_queue.find_one({
                "guideline_substance_hash": substance_hash,
                "triage_status": {"$in": ["assigned", "open"]}
            })
            if existing_gap:
                # Update existing gap page list
                await db.gap_queue.update_one(
                    {"gap_id": existing_gap["gap_id"]},
                    {"$addToSet": {"page_numbers_list": page_num}}
                )
                continue
                
            # Classify severity and routing
            severity, due_days = parse_severity_and_deadline(clause_text)
            dept_id, is_ambiguous, ambiguous_depts = route_department(circular_num, clause_text)
            
            # Resolve HOD
            dept_doc = await db.departments.find_one({"department_id": dept_id})
            hod_id = dept_doc.get("head_employee_id", "EMP-COMPLIANCE-HEAD") if dept_doc else "EMP-COMPLIANCE-HEAD"
            
            # Auto-assign with availability checks
            employee_id = await get_available_employee(db, dept_id)
            
            # Set due date
            due_date = datetime.utcnow() + timedelta(days=due_days)
            
            gap_id = f"GAP-{str(uuid.uuid4())[:8].upper()}"
            
            # Generate template mismatch description
            pol_title = best_policy["title"] if best_policy else "N/A"
            c_text_preview = (best_clause_text[:100] + "...") if best_clause_text else "N/A"
            mismatch_desc = (
                f"RBI Circular {title}, Page {page_num} mandates: '{clause_text}'. "
                f"Current Bank Policy '{pol_title}', Page {best_clause_page} states: '{c_text_preview}'. "
                f"GAP: {gap_type.upper()}. Department: {dept_doc.get('name', 'Compliance') if dept_doc else 'Compliance'} must address this."
            )
            
            # N:1 Mapping: Create separate entries if other clauses score above 0.60
            parent_guideline_id = None
            if len(matches_above_threshold) > 1:
                parent_guideline_id = gap_id
                
            entry = {
                "gap_id": gap_id,
                "circular_id": circular_id,
                "circular_title": title,
                "clause_number": clause_num,
                "clause_text": clause_text,
                "obligation_type": clause.get("obligation_type"),
                "severity": severity,
                "gap_status": gap_status,
                "similarity_score": round(best_score, 4),
                "top_policy_id": best_policy["policy_id"] if best_policy else "POL-COMP-001",
                "top_policy_title": best_policy["title"] if best_policy else "Compliance Policy",
                "classification_reason": reason,
                "routing": "auto_routed",
                "triage_status": "assigned" if employee_id else "open",
                "created_at": datetime.utcnow(),
                "page_number": page_num,
                "page_numbers_list": [page_num],
                "department_id": dept_id,
                "assigned_hod": hod_id,
                "assigned_employee": employee_id,
                "due_date": due_date,
                "fixed_policy_content": None,
                "remaining_gaps": [],
                "is_fixed": False,
                # Hardening additions
                "guideline_substance_hash": substance_hash,
                "parent_guideline_id": parent_guideline_id,
                "source": "circular_upload",
                "is_ambiguous": is_ambiguous,
                "ambiguous_departments": ambiguous_depts,
                "mismatch_description": mismatch_desc
            }
            queue_entries.append(entry)
            
            # Update employee counters if assigned
            if employee_id:
                await db.users.update_one(
                    {"emp_id": employee_id},
                    {
                        "$inc": {"active_gap_count": 1},
                        "$set": {"last_assigned_date": datetime.utcnow()}
                    }
                )
                
                # Notify Employee
                await db.notifications.insert_one({
                    "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
                    "user_id": employee_id,
                    "title": "New Gap Assigned",
                    "message": f"Gap {gap_id} (Page {page_num}) has been assigned to you. Due by {due_date.strftime('%Y-%m-%d')}.",
                    "type": "gap_assigned",
                    "gap_id": gap_id,
                    "is_read": False,
                    "created_at": datetime.utcnow()
                })
                
            # Notify HOD
            await db.notifications.insert_one({
                "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
                "user_id": hod_id,
                "title": "New Departmental Gap",
                "message": f"Gap {gap_id} has been auto-routed to your department. " + (f"Assigned to employee {employee_id}." if employee_id else "No employees available - manual assignment required."),
                "type": "gap_assigned",
                "gap_id": gap_id,
                "is_read": False,
                "created_at": datetime.utcnow()
            })

    if queue_entries:
        await db.gap_queue.insert_many(queue_entries)

    total = len(results)
    covered = counters["covered"]
    duration_ms = int((time.time() - start) * 1000)

    return GapDetectionResponse(
        circular_id=circular_id,
        total_clauses_analyzed=total,
        covered=covered,
        suspected=0,
        confirmed=counters["confirmed"],
        data_errors=counters["data_error"],
        coverage_rate=round(covered / total, 4) if total > 0 else 0.0,
        gaps=results,
        detection_time_ms=duration_ms,
        status="completed"
    )

# ─────────────────────────────────────────────────────────────
#  Regression & Recheck Verification Pipeline
# ─────────────────────────────────────────────────────────────

async def recheck_policy_gap(gap_id: str, updated_content: str, db: Any) -> Dict[str, Any]:
    gap = await db.gap_queue.find_one({"gap_id": gap_id})
    if not gap:
        return {"resolved": False, "remaining_gaps": ["Gap not found."]}

    clause_text = gap.get("clause_text", "")
    rake = RakeKeywordExtractor()
    
    clause_kws = set(rake.extract_keywords(clause_text))
    
    # Segment updated_content into sentences/paragraphs/clauses for granular checking
    updated_sentences = []
    try:
        from services.watcher import parse_clauses
        parsed_c = parse_clauses(updated_content)
        updated_sentences.extend([c.text for c in parsed_c if c.text.strip()])
    except Exception:
        pass
        
    for part in re.split(r'\.\s+|\n+', updated_content):
        if part.strip():
            updated_sentences.append(part.strip())
            
    updated_sentences.append(updated_content.strip())
    
    best_score = 0.0
    for sentence in set(updated_sentences):
        sent_kws = set(rake.extract_keywords(sentence))
        s_score = calculate_weighted_score(clause_text, sentence, clause_kws, sent_kws)
        if s_score > best_score:
            best_score = s_score
            
    score = best_score
    original_resolved = score >= SIMILARITY_THRESHOLD_MATCH

    
    # 2. Check for REGRESSIONS: run full gap detection for ALL active circulars against the updated content
    today = datetime.utcnow()
    active_circulars = await db.circulars.find({"ingestion_status": {"$in": ["fully_parsed", "partially_parsed"]}}).to_list(length=100)
    
    introduced_gaps = []
    
    for circ in active_circulars:
        # Skip evaluating the original circular guideline being resolved
        circ_clauses = circ.get("clauses", [])
        for cc in circ_clauses:
            if cc.get("obligation_type") not in ("shall", "must", "should"):
                continue
            cc_text = cc.get("text", "")
            if cc_text == clause_text:
                continue
                
            cc_kws = set(rake.extract_keywords(cc_text))
            
            best_cc_score = 0.0
            for sentence in set(updated_sentences):
                sent_kws = set(rake.extract_keywords(sentence))
                s_score = calculate_weighted_score(cc_text, sentence, cc_kws, sent_kws)
                if s_score > best_cc_score:
                    best_cc_score = s_score
            
            cc_score = best_cc_score
            
            # If similarity is below threshold, it's a regression violation
            if cc_score < SIMILARITY_THRESHOLD_PARTIAL:
                introduced_gaps.append({
                    "circular_id": circ["circular_id"],
                    "circular_title": circ.get("title", ""),
                    "clause_text": cc_text,
                    "score": cc_score
                })

    employee_id = gap.get("assigned_employee")
    employee_doc = await db.users.find_one({"emp_id": employee_id})
    employee_name = employee_doc.get("name", "Employee") if employee_doc else "Employee"

    if original_resolved and not introduced_gaps:
        # ── SUCCESS ──
        await db.gap_queue.update_one(
            {"gap_id": gap_id},
            {
                "$set": {
                    "triage_status": "resolved",
                    "fixed_policy_content": updated_content,
                    "is_fixed": True,
                    "remaining_gaps": [],
                    "similarity_score": round(score, 4),
                    "classification_reason": f"Resolved: Guideline matches updated policy content (score {score:.2f} >= {SIMILARITY_THRESHOLD_MATCH})"
                }
            }
        )
        
        # Decrement workload counter
        if employee_id:
            await db.users.update_one(
                {"emp_id": employee_id},
                {"$inc": {"active_gap_count": -1}}
            )

        # Notify HOD
        await db.notifications.insert_one({
            "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
            "user_id": gap.get("assigned_hod"),
            "title": "Gap Resolved",
            "message": f"Gap {gap_id} has been resolved by {employee_name} in Policy '{gap.get('top_policy_title')}'. Pending review.",
            "type": "gap_resolved",
            "gap_id": gap_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })

        # Notify Admin
        await db.notifications.insert_one({
            "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
            "user_id": "EMP-ADMIN-001",
            "title": "Core Policy Update Awaiting HOD Approval",
            "message": f"Gap {gap_id} has been resolved by {employee_name}. Approve to apply to core bank policies.",
            "type": "gap_resolved",
            "gap_id": gap_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })

        return {"resolved": True, "status": "resolved", "remaining_gaps": []}
        
    elif original_resolved and introduced_gaps:
        # ── REGRESSION DETECTED ──
        # Fix original gap
        await db.gap_queue.update_one(
            {"gap_id": gap_id},
            {
                "$set": {
                    "triage_status": "resolved",
                    "fixed_policy_content": updated_content,
                    "is_fixed": True,
                    "remaining_gaps": [f"Regression: introduces gaps on other circulars"]
                }
            }
        )
        
        if employee_id:
            await db.users.update_one(
                {"emp_id": employee_id},
                {"$inc": {"active_gap_count": -1}}
            )

        # Generate regression gaps
        new_gaps = []
        for reg in introduced_gaps:
            reg_gap_id = f"GAP-{str(uuid.uuid4())[:8].upper()}"
            reg_substance_hash = compute_substance_hash(reg["clause_text"])
            reg_entry = {
                "gap_id": reg_gap_id,
                "circular_id": reg["circular_id"],
                "circular_title": reg["circular_title"],
                "clause_text": reg["clause_text"],
                "severity": "high",
                "gap_status": "confirmed",
                "similarity_score": round(reg["score"], 4),
                "top_policy_id": gap.get("top_policy_id"),
                "top_policy_title": gap.get("top_policy_title"),
                "classification_reason": f"Regression: introduced by fixing {gap_id}",
                "routing": "auto_routed",
                "triage_status": "assigned" if employee_id else "open",
                "created_at": datetime.utcnow(),
                "page_number": 1,
                "page_numbers_list": [1],
                "department_id": gap.get("department_id"),
                "assigned_hod": gap.get("assigned_hod"),
                "assigned_employee": employee_id,
                "due_date": datetime.utcnow() + timedelta(days=7),
                "fixed_policy_content": None,
                "remaining_gaps": [],
                "is_fixed": False,
                "guideline_substance_hash": reg_substance_hash,
                "parent_guideline_id": gap_id,
                "source": "fix_regression",
                "is_ambiguous": False,
                "ambiguous_departments": [],
                "mismatch_description": f"REGRESSION: Fixing Gap {gap_id} broke guideline compliance for circular {reg['circular_title']}."
            }
            new_gaps.append(reg_entry)
            
            if employee_id:
                await db.users.update_one(
                    {"emp_id": employee_id},
                    {"$inc": {"active_gap_count": 1}}
                )
                
        if new_gaps:
            await db.gap_queue.insert_many(new_gaps)
            
        # Notify HOD
        await db.notifications.insert_one({
            "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
            "user_id": gap.get("assigned_hod"),
            "title": "Regressions Detected in Policy Fix",
            "message": f"Gap {gap_id} fix resolved the issue but introduced {len(new_gaps)} new regressions. Created regression tasks.",
            "type": "fix_rejected",
            "gap_id": gap_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })

        return {"resolved": True, "status": "resolved_with_regression", "new_gaps": new_gaps, "remaining_gaps": []}
        
    else:
        # ── FAILED TO RESOLVE ──
        mismatch_msg = f"The updated policy still does not comply with the circular guideline (score: {score:.2f} < {SIMILARITY_THRESHOLD_MATCH})."
        await db.gap_queue.update_one(
            {"gap_id": gap_id},
            {
                "$set": {
                    "fixed_policy_content": updated_content,
                    "is_fixed": False,
                    "remaining_gaps": [mismatch_msg]
                }
            }
        )
        
        # Extend deadline by 3 days
        extended_due = (gap.get("due_date") or datetime.utcnow()) + timedelta(days=3)
        await db.gap_queue.update_one(
            {"gap_id": gap_id},
            {"$set": {"due_date": extended_due}}
        )

        # Notify Employee
        await db.notifications.insert_one({
            "notification_id": f"NOTIF-{str(uuid.uuid4())[:8].upper()}",
            "user_id": employee_id,
            "title": "Fix Rejected - Gap Still Active",
            "message": f"Submitting fixes for Gap {gap_id} failed. Some mismatches are still present. New deadline: {extended_due.strftime('%Y-%m-%d')}.",
            "type": "fix_rejected",
            "gap_id": gap_id,
            "is_read": False,
            "created_at": datetime.utcnow()
        })

        return {"resolved": False, "status": "failed", "remaining_gaps": [mismatch_msg]}
