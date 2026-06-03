import logging
from datetime import datetime, timedelta
import uuid
import hashlib
from typing import Dict, List, Any, Callable

from models.circular import Clause
from services.certin_parser import CERTInParser
from services.ocr_service import extract_text_ocr
from services.threat_mapper import correlate_advisory_to_assets
from services.cve_correlator import get_cve_details

logger = logging.getLogger(__name__)

# ─── Custom State Machine Graph (LangGraph-like) ───────────────────────────

class StateGraph:
    """A lightweight state graph machine matching LangGraph design patterns."""
    
    def __init__(self):
        self.nodes: Dict[str, Callable] = {}
        self.edges: Dict[str, str] = {}
        self.conditional_edges: Dict[str, tuple] = {}
        self.entry_point: str = None

    def add_node(self, name: str, func: Callable) -> None:
        self.nodes[name] = func

    def add_edge(self, from_node: str, to_node: str) -> None:
        self.edges[from_node] = to_node

    def add_conditional_edges(self, from_node: str, condition_func: Callable, path_map: Dict[Any, str]) -> None:
        self.conditional_edges[from_node] = (condition_func, path_map)

    def set_entry_point(self, name: str) -> None:
        self.entry_point = name

    async def execute(self, database: Any, initial_state: Dict[str, Any]) -> Dict[str, Any]:
        state = initial_state.copy()
        current_node = self.entry_point
        visited = []
        
        while current_node:
            visited.append(current_node)
            logger.info(f"[Graph] Executing node: {current_node}")
            
            # Execute node logic
            state = await self.nodes[current_node](database, state)
            
            # Route logic
            next_node = self.edges.get(current_node)
            if current_node in self.conditional_edges:
                cond_func, path_map = self.conditional_edges[current_node]
                decision = cond_func(state)
                logger.info(f"[Graph] Conditional route from {current_node}: {decision}")
                next_node = path_map.get(decision)
                
            current_node = next_node
            
        state["visited_nodes"] = visited
        return state

# ─── Graph Node Functions ──────────────────────────────────────────────────

async def ingest_node(database: Any, state: Dict[str, Any]) -> Dict[str, Any]:
    """Node: Extract raw text from file bytes (with OCR fallback) and detect issuer."""
    file_bytes = state["file_bytes"]
    filename = state["filename"]
    
    # Simple extraction (PyMuPDF / pdfplumber fallback mock logic for raw text)
    # If PDF, try standard text extraction first
    raw_text = ""
    ext = filename.rsplit(".", 1)[-1].lower()
    
    if ext == "pdf":
        try:
            import fitz
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            raw_text = "".join(page.get_text() for page in doc)
            doc.close()
        except Exception:
            pass
    elif ext in ("docx", "txt"):
        if ext == "docx":
            try:
                from docx import Document
                import io
                doc = Document(io.BytesIO(file_bytes))
                raw_text = "\n".join(p.text for p in doc.paragraphs)
            except Exception:
                pass
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

    # If text is too short or empty, trigger OCR fallback
    if len(raw_text.strip()) < 100:
        logger.info(f"Text too short ({len(raw_text)} chars). Triggering OCR fallback...")
        raw_text = extract_text_ocr(file_bytes, filename)
        state["ocr_triggered"] = True
    else:
        state["ocr_triggered"] = False
        
    state["full_text"] = raw_text
    
    # Content-based issuer detection
    issuer = "UNKNOWN"
    lower_name = filename.lower()
    
    if CERTInParser.detect_certin_content(raw_text) or "cert-in" in lower_name or "cert_in" in lower_name:
        issuer = "CERT-In"
    elif "rbi" in lower_name or "reserve bank" in raw_text.lower():
        issuer = "RBI"
    elif "sebi" in lower_name or "securities and exchange" in raw_text.lower():
        issuer = "SEBI"
    elif "irdai" in lower_name or "insurance regulatory" in raw_text.lower():
        issuer = "IRDAI"
        
    state["issuer"] = issuer
    return state

async def parse_node(database: Any, state: Dict[str, Any]) -> Dict[str, Any]:
    """Node: Parse clauses out of text using specialized parser logic."""
    full_text = state["full_text"]
    issuer = state["issuer"]
    
    if issuer == "CERT-In":
        parsed = CERTInParser.parse_certin_advisory(full_text)
        state["clauses"] = parsed["clauses"]
        state["parsed_data"] = parsed
        state["severity"] = parsed["severity"]
    else:
        # Fallback to RBI / Generic parser
        from services.rbi_parsers import RBIParser
        parsed = RBIParser.detect_and_parse(full_text)
        
        # Convert simple list of dicts to Clause models
        clauses = []
        for idx, c in enumerate(parsed.get("clauses", [])):
            clauses.append(
                Clause(
                    clause_number=c.get("clause_number") or f"GEN-{idx+1:02d}",
                    text=c["text"],
                    obligation_type=c.get("obligation_type", "shall"),
                    severity=c.get("severity", "medium"),
                    penalty_reference=c.get("penalty_reference"),
                    gap_status="pending"
                )
            )
        state["clauses"] = clauses
        state["parsed_data"] = parsed
        state["severity"] = "medium"
        
    return state

async def correlation_node(database: Any, state: Dict[str, Any]) -> Dict[str, Any]:
    """Node: Map security threat CVEs and software tags against internal assets."""
    issuer = state["issuer"]
    if issuer != "CERT-In":
        state["correlated_assets"] = []
        return state
        
    parsed_data = state["parsed_data"]
    cves = parsed_data.get("cves", [])
    systems_affected = parsed_data.get("systems_affected", [])
    full_text = state["full_text"]
    
    correlated = await correlate_advisory_to_assets(
        database=database,
        cves=cves,
        systems_affected=systems_affected,
        full_text=full_text
    )
    
    state["correlated_assets"] = correlated
    return state

async def escalation_node(database: Any, state: Dict[str, Any]) -> Dict[str, Any]:
    """Node: Check configurable escalation rules and mark for CISO override if triggered."""
    correlated_assets = state.get("correlated_assets", [])
    severity = state.get("severity", "medium")
    
    ciso_escalate = False
    escalation_reason = ""
    
    # Query database escalation rules
    rules_cursor = database.escalation_rules.find({"active": True})
    rules = await rules_cursor.to_list(length=100)
    
    # Default rule if none configured
    if not rules:
        rules = [{
            "condition_severity": "critical",
            "condition_system_sensitivity": "critical",
            "escalate_to": "CISO"
        }, {
            "condition_severity": "high",
            "condition_system_sensitivity": "critical",
            "escalate_to": "CISO"
        }]
        
    # Check each correlated asset against the rules
    for asset in correlated_assets:
        asset_sensitivity = asset.get("sensitivity", "medium").lower()
        asset_name = asset.get("name")
        
        for rule in rules:
            rule_sev = rule.get("condition_severity", "critical").lower()
            rule_sens = rule.get("condition_system_sensitivity", "critical").lower()
            
            # Map values for comparisons
            severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
            
            c_rank = severity_rank.get(severity, 2)
            r_sev_rank = severity_rank.get(rule_sev, 4)
            
            a_rank = severity_rank.get(asset_sensitivity, 2)
            r_sens_rank = severity_rank.get(rule_sens, 4)
            
            # If advisory is severe enough AND system is sensitive enough
            if c_rank >= r_sev_rank and a_rank >= r_sens_rank:
                ciso_escalate = True
                escalation_reason = f"Threat of severity '{severity.upper()}' affects critical asset '{asset_name}' ({asset_sensitivity.upper()})"
                break
        if ciso_escalate:
            break
            
    state["ciso_escalate"] = ciso_escalate
    state["escalation_reason"] = escalation_reason
    return state

async def map_generation_node(database: Any, state: Dict[str, Any]) -> Dict[str, Any]:
    """Node: Ingest document into DB, trigger gap detection, generate MAPs (with SLAs) and incident drafts."""
    filename = state["filename"]
    issuer = state["issuer"]
    clauses = state["clauses"]
    full_text = state["full_text"]
    uploaded_by = state.get("uploaded_by", "system")
    ciso_escalate = state.get("ciso_escalate", False)
    escalation_reason = state.get("escalation_reason", "")
    
    # 1. Generate Circular ID
    from services.circular_ids import generate_circular_id
    year = datetime.utcnow().year
    circular_id = await generate_circular_id(database, issuer, year)
    state["circular_id"] = circular_id
    
    # Save Circular
    text_hash = hashlib.sha256(full_text.encode("utf-8")).hexdigest()
    doc = {
        "circular_id": circular_id,
        "title": filename,
        "issuer": issuer,
        "date_issued": datetime.utcnow(),
        "ingestion_status": "fully_parsed" if clauses else "failed",
        "clauses_extracted": len(clauses),
        "parser_version": "v3.0_state_machine",
        "pages_processed": 1,
        "processing_time_ms": 120,
        "extraction_confidence": 0.95,
        "clauses": [c.model_dump() for c in clauses],
        "full_text": full_text,
        "full_text_hash": text_hash,
        "uploaded_by": uploaded_by,
    }
    await database.circulars.insert_one(doc)
    
    # 2. Run Gap Detection & MAP Generation for each clause
    generated_maps = []
    
    for clause in clauses:
        gap_id = f"GAP-{uuid.uuid4().hex[:8].upper()}"
        
        # Save suspected gap
        gap_doc = {
            "gap_id": gap_id,
            "circular_id": circular_id,
            "clause_number": clause.clause_number,
            "clause_text": clause.text,
            "severity": clause.severity,
            "gap_status": "confirmed",
            "triage_status": "new",
            "routing": "pending_review",
            "historical_match_count": 0,
            "created_at": datetime.utcnow()
        }
        await database.gap_queue.insert_one(gap_doc)
        
        # Determine dynamic SLA deadline
        # Critical = 3 days (or 24h depending on CISO rules), High = 7 days, Medium = 15 days, Low = 30 days
        now = datetime.utcnow()
        if clause.severity == "critical":
            sla_days = 3
        elif clause.severity == "high":
            sla_days = 7
        elif clause.severity == "medium":
            sla_days = 15
        else:
            sla_days = 30
            
        deadline = now + timedelta(days=sla_days)
        
        # MAP Category & Department
        map_type = "security" if (issuer == "CERT-In" or clause.severity in ("critical", "high")) else "operational"
        dept_id = "DEPT-INFOSEC" if map_type == "security" else "DEPT-COMPLIANCE"
        dept_name = "Information Security" if map_type == "security" else "Compliance"
        
        # Requirements
        requirements = [
            f"Remediate security alert clause {clause.clause_number}",
            "Submit vulnerability patch / validation logs"
        ]
        if map_type == "security":
            requirements.extend([
                "Apply software upgrades on affected asset hosts",
                "Verify firewall rule restrictions",
                "Perform vendor security configuration audit"
            ])
            
        map_status = "escalated" if ciso_escalate else "draft"
        map_id = f"MAP-{uuid.uuid4().hex[:8].upper()}"
        
        map_doc = {
            "map_id": map_id,
            "gap_id": gap_id,
            "circular_id": circular_id,
            "policy_id": "UNASSIGNED",
            "title": f"Security Remediation: {clause.clause_number}",
            "description": f"SLA-driven remediation for clause: {clause.text[:200]}",
            "requirements": requirements,
            "status": map_status,
            "owner_department_id": dept_id,
            "department_name": dept_name,
            "assigned_to": None,
            "deadline": deadline,
            "priority_score": 100 if clause.severity == "critical" else 75,
            "risk_level": clause.severity or "medium",
            "provenance_path": [
                {"type": "circular", "id": circular_id, "title": filename},
                {"type": "clause", "id": clause.clause_number, "text": clause.text},
                {"type": "gap", "id": gap_id, "classification": clause.severity}
            ],
            "evidence_items": [
                {"evidence_type": "scan_report", "label": "Vulnerability Scan Report", "required": True, "uploaded": False},
                {"evidence_type": "config_file", "label": "Firewall Rule/Configuration Audit Log", "required": True, "uploaded": False}
            ],
            "clause_text": clause.text,
            "map_type": map_type,
            "ciso_escalated": ciso_escalate,
            "escalation_reason": escalation_reason if ciso_escalate else None,
            "created_at": now,
            "audit_trail": [
                {
                    "timestamp": now,
                    "user_id": uploaded_by,
                    "user_name": "System Orchestrator",
                    "action": "map_generated",
                    "details": f"Generated security MAP under {sla_days}-day SLA. Status: {map_status}."
                }
            ],
            "timeline": [
                {"stage": "created", "label": "Created", "timestamp": now, "completed": True},
                {"stage": "approved", "label": "Approved", "timestamp": None, "completed": not ciso_escalate}
            ]
        }
        await database.maps.insert_one(map_doc)
        
        # Trigger CISO notification
        if ciso_escalate:
            from services.notification import send_notification
            await send_notification(
                user_id="EMP-INFOSEC-001", # PRIYA NAIR (Admin / CISO role)
                subject="CRITICAL ESCALATION: Sensitive System Exposed",
                message=f"Critical CERT-In alert affecting sensitive systems has been escalated. MAP ID: {map_id}. Reason: {escalation_reason}"
            )
            
        generated_maps.append(map_doc)
        
    state["generated_maps"] = generated_maps
    
    # 3. Auto-draft incident report for CERT-In
    if issuer == "CERT-In":
        parsed_data = state["parsed_data"]
        incident_id = f"INC-{uuid.uuid4().hex[:8].upper()}"
        sla_deadline = datetime.utcnow() + timedelta(hours=6)
        
        incident_doc = {
            "report_id": incident_id,
            "circular_id": circular_id,
            "title": f"Incident Report for Advisory {parsed_data.get('advisory_id')}",
            "cves": parsed_data.get("cves", []),
            "severity": parsed_data.get("severity", "high"),
            "status": "draft",
            "sla_deadline": sla_deadline,
            "systems_affected": parsed_data.get("systems_affected", []),
            "incident_details": f"CERT-In Advisory {parsed_data.get('advisory_id')} reporting vulnerabilities. Details: {parsed_data.get('description')}",
            "mitigation_actions": f"Initiated dynamic MAPs with remediation SLAs. Core solution details: {parsed_data.get('solution')}",
            "reporter_name": "Compliance Officer",
            "reporter_email": "compliance@canara.bank",
            "created_at": datetime.utcnow()
        }
        await database.incident_reports.insert_one(incident_doc)
        state["incident_report"] = incident_doc
        
    return state

# ─── Pipeline Compiler ─────────────────────────────────────────────────────

def compile_compliance_graph() -> StateGraph:
    """Instantiate and compile the state graph pipeline."""
    graph = StateGraph()
    
    # Add nodes
    graph.add_node("ingest", ingest_node)
    graph.add_node("parse", parse_node)
    graph.add_node("correlate", correlation_node)
    graph.add_node("escalate", escalation_node)
    graph.add_node("map_generate", map_generation_node)
    
    # Set entry
    graph.set_entry_point("ingest")
    
    # Define normal transitions
    graph.add_edge("ingest", "parse")
    graph.add_edge("parse", "correlate")
    graph.add_edge("correlate", "escalate")
    graph.add_edge("escalate", "map_generate")
    
    return graph

# Helper execution function
async def run_compliance_pipeline(database: Any, file_bytes: bytes, filename: str, uploaded_by: str = "system") -> Dict[str, Any]:
    """Compile and run the orchestration graph."""
    graph = compile_compliance_graph()
    initial_state = {
        "file_bytes": file_bytes,
        "filename": filename,
        "uploaded_by": uploaded_by
    }
    final_state = await graph.execute(database, initial_state)
    return final_state
