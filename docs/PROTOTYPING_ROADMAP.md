# SuRaksha MAPS v4.0 — Prototyping Phase Roadmap
## Detailed Implementation Guide (Weeks 1–16)

**Document Date:** May 2026  
**Target:** Full production readiness by August 2026 (post-hackathon)

---

## Executive Overview

The hackathon submission delivers a **core compliance platform** with:
- ✅ Regulatory ingestion & parsing
- ✅ Gap detection via semantic similarity
- ✅ Human-in-the-loop MAP generation
- ✅ Graph-based intelligent routing
- ✅ Evidence validation
- ✅ Immutable audit trails
- ✅ Behavioral biometric authentication

The prototyping phase will **automate** these workflows and extend capabilities to create a fully agentic platform that requires minimal human intervention while maintaining compliance and auditability.

---

## Phase 1: Autonomous Workflow Automation (Weeks 1–4)

### 1.1 Smart Evidence Collection Agent

**Current State:**
- Departments manually collect evidence (screenshots, certificate files, audit logs)
- Example: MAP requires "Prove firewall rule XYZ is implemented"
- Department searches firewall logs, exports config file, attaches to system
- Time: 2 hours per evidence item

**Goal:**
- Autonomous agent queries internal systems based on MAP evidence requirements
- Reduces time from 2 hours to 5 minutes
- Maintains audit trail of all API calls

**Implementation Details:**

**Step 1: Evidence Requirement Registry**
- Define evidence types and required data sources:
  ```json
  {
    "evidence_types": [
      {
        "id": "firewall_rule_config",
        "name": "Firewall Rule Configuration",
        "required_fields": ["rule_id", "source_ip", "dest_ip", "action", "timestamp"],
        "data_sources": ["firewall_api", "firewall_logs"]
      },
      {
        "id": "user_access_logs",
        "name": "User Access Logs",
        "required_fields": ["user_id", "access_time", "resource", "action"],
        "data_sources": ["ldap_api", "security_logs"]
      },
      {
        "id": "encryption_certificate",
        "name": "SSL/TLS Certificate",
        "required_fields": ["domain", "issuer", "expiry_date", "thumbprint"],
        "data_sources": ["certificate_store", "tls_logs"]
      }
    ]
  }
  ```

**Step 2: LangGraph Tools for API Queries**
```python
# services/evidence_collector.py
from langchain.tools import tool
from tenacity import retry, stop_after_attempt

@tool
@retry(stop=stop_after_attempt(3))
def query_firewall_rules(rule_id: str) -> dict:
    """Query firewall API to retrieve rule configuration"""
    # Connect to firewall (Palo Alto / Fortinet / Cisco ASA)
    # Return: rule config, timestamps, last modified
    pass

@tool
def query_ldap_users(department: str) -> list:
    """Query LDAP directory for users in department"""
    # Connect to LDAP server
    # Return: user list with attributes
    pass

@tool
def query_antivirus_logs(host: str, days: int = 7) -> list:
    """Query antivirus endpoint for protection status"""
    # Query Defender / Kaspersky API
    # Return: protection events, latest scan results
    pass

@tool
def retrieve_certificate(domain: str) -> dict:
    """Retrieve SSL/TLS certificate details"""
    # Query certificate store (Windows / Let's Encrypt)
    # Return: cert details, validity, thumbprint
    pass
```

**Step 3: Evidence Collection Workflow**
```
MAP created with evidence requirement → Evidence Type identified → 
LangGraph selects appropriate tool → Execute query → 
Validate response against schema → Attach to MAP → 
Log API query with timestamp and status → Mark complete
```

**Step 4: Admin Controls**
- Checkbox per evidence type: "Enable Auto-Collection"
- Default: Enabled for safe, read-only queries (disable for destructive APIs)
- Audit trail: Show all auto-collected evidence with API call details
- Manual fallback: If auto-collection fails, prompt department to upload manually

**Step 5: Security & Access Control**
- Service account credentials for API queries (separate from user login)
- Audit log: Every API call logged with:
  - Evidence type
  - Query parameters
  - Response size
  - Timestamp
  - Service account used
  - Success/failure
- Encryption: Credentials stored in Vault (HashiCorp or AWS Secrets Manager)

**Metrics:**
- Evidence collection time: 2 hours → 5 minutes (24x improvement)
- Manual evidence submission: 80% → 20% (auto-collection rate)
- Evidence validation time: 20 minutes → 2 minutes (automated schema checks)

**Database Changes:**
```javascript
db.maps.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      evidence_items: [
        {
          type: "firewall_rule_config",
          auto_collected: true,
          query_tool: "query_firewall_rules",
          query_params: { rule_id: "xyz123" },
          api_call_timestamp: ISODate("2026-05-21T10:30:00Z"),
          api_call_duration_ms: 250,
          response: { ... },
          validation_status: "passed",
          audit_log_id: ObjectId("...")
        }
      ]
    }
  }
)
```

---

### 1.2 Department-Specific Workflow Templates

**Current State:**
- All departments follow generic workflow: Evidence → Validation → Completion
- No department-specific customization

**Goal:**
- Configurable workflows per department without code changes
- Departments can define custom approval chains, escalation rules, evidence priorities
- Versioning and audit trail for workflow changes

**Implementation Details:**

**Step 1: Workflow Template Schema**
```json
{
  "workflow_id": "vendor_risk_audit_it",
  "department": "IT",
  "name": "Vendor Risk Audit Workflow",
  "description": "Process for auditing third-party vendor security controls",
  "version": 1,
  "created_by": "it_lead@bank.com",
  "created_at": "2026-05-21T10:00:00Z",
  "steps": [
    {
      "step_id": "step_1",
      "name": "Initial Assessment",
      "description": "Review vendor security documentation",
      "assigned_role": "IT_ANALYST",
      "required_evidence": ["vendor_security_doc"],
      "duration_hours": 4,
      "escalation_if_delayed_hours": 2,
      "next_step": "step_2",
      "conditions": []
    },
    {
      "step_id": "step_2",
      "name": "Peer Review",
      "description": "Second analyst review for compliance",
      "assigned_role": "IT_SENIOR",
      "required_evidence": ["assessment_report"],
      "duration_hours": 2,
      "escalation_if_delayed_hours": 1,
      "next_step": "step_3",
      "conditions": [
        { "field": "assessment_report.risk_level", "operator": "==", "value": "high" }
      ]
    },
    {
      "step_id": "step_3",
      "name": "Manager Sign-Off",
      "description": "IT Manager approval",
      "assigned_role": "IT_MANAGER",
      "required_evidence": ["peer_review_approval"],
      "duration_hours": 1,
      "escalation_if_delayed_hours": 0.5,
      "next_step": "complete",
      "conditions": []
    }
  ]
}
```

**Step 2: Workflow Builder UI (Admin Portal)**
- Drag-and-drop interface to create workflow steps
- Add/remove/reorder steps without code
- Define role requirements per step
- Set duration and escalation rules
- Preview workflow visualization

**Step 3: LangGraph Workflow Orchestration**
```python
# services/workflow_executor.py
class WorkflowExecutor:
    def __init__(self, map_obj: MAP, workflow_template: dict):
        self.map = map_obj
        self.workflow = workflow_template
        self.current_step = 0
    
    async def execute_step(self):
        step = self.workflow["steps"][self.current_step]
        
        # Assign to appropriate role
        assignee = await self.find_assignee(step["assigned_role"])
        
        # Create task
        task = {
            "map_id": self.map._id,
            "step_id": step["step_id"],
            "assigned_to": assignee,
            "deadline": datetime.now() + timedelta(hours=step["duration_hours"]),
            "required_evidence": step["required_evidence"],
            "status": "pending"
        }
        await db.tasks.insert_one(task)
        
        # Schedule escalation check
        await self.schedule_escalation_check(
            map_id=self.map._id,
            step_id=step["step_id"],
            delay_hours=step["escalation_if_delayed_hours"]
        )
        
        # Notify assignee
        await self.send_notification(assignee, task)
    
    async def complete_step(self, evidence_submitted: dict):
        step = self.workflow["steps"][self.current_step]
        
        # Validate evidence
        validation_result = await self.validate_evidence(
            required=step["required_evidence"],
            submitted=evidence_submitted
        )
        
        if validation_result["passed"]:
            # Move to next step
            if step["next_step"] != "complete":
                self.current_step += 1
                await self.execute_step()
            else:
                # Workflow complete
                self.map.status = "completed"
                await db.maps.update_one(
                    {"_id": self.map._id},
                    {"$set": {"status": "completed", "completed_at": datetime.now()}}
                )
```

**Step 4: Per-Department Workflow Examples**

**Legal Department Workflow:**
```
1. Receive MAP with contract clause requirement
2. Legal Analyst → Initial contract review (4 hours)
3. Senior Legal Counsel → Peer review (2 hours)
4. General Counsel → Approval (1 hour)
5. Complete
```

**Operations Department Workflow:**
```
1. Receive MAP with operational change requirement
2. Ops Manager → Field deployment (8 hours, can be parallel to next)
3. Regional Manager → Sign-off from field (2 hours)
4. Ops Head → Strategic sign-off (1 hour)
5. Complete
```

**IT Department Workflow:**
```
1. Receive MAP with security control requirement
2. IT Analyst → Technical implementation (8 hours)
3. Security Team → Penetration test / validation (4 hours)
4. IT Manager → Sign-off (1 hour)
5. Complete
```

**Step 5: Workflow Change Audit Trail**
```python
# Log all workflow modifications
db.workflow_audit_logs.insert_one({
  "workflow_id": "vendor_risk_audit_it",
  "version": 2,
  "changed_by": "it_lead@bank.com",
  "changed_at": datetime.now(),
  "change_type": "step_added",
  "details": {
    "new_step": "security_penetration_test",
    "position": 2
  },
  "previous_version": { ... },
  "new_version": { ... }
})
```

**Metrics:**
- Workflow customization time: <15 minutes (vs. 2-week dev cycle)
- Department adoption: 100% of departments define custom workflows
- Approval cycle time reduced: 20% improvement via optimized routing

---

### 1.3 Continuous MAP Completion Monitoring

**Current State:**
- Manual check-ins when MAP deadline approaches
- No early detection of stalled progress
- Ad-hoc escalation when issues arise

**Goal:**
- Autonomous agent monitors all in-progress MAPs
- Proactively detects stalled work (no progress in 48 hours)
- Auto-escalates with smart routing: reminder → manager chat → CISO alert
- Predicts completion date based on historical performance

**Implementation Details:**

**Step 1: Progress Tracking Schema**
```python
# models/map.py - enhanced
class MAP(BaseModel):
    # ... existing fields ...
    
    # Progress tracking
    workflow_step_history: List[Dict] = []  # Track step transitions
    evidence_submission_timestamps: List[datetime] = []
    last_activity_timestamp: datetime
    estimated_completion_date: datetime
    status_transitions: List[Dict] = [
        {
            "from_status": "draft",
            "to_status": "approved",
            "timestamp": datetime,
            "transitioned_by": str
        }
    ]
```

**Step 2: Stall Detection Algorithm**
```python
# services/map_completion_monitor.py
from datetime import datetime, timedelta

class MapCompletionMonitor:
    STALL_THRESHOLD_HOURS = 48
    
    async def detect_stalled_maps(self):
        """Run every 6 hours via scheduler"""
        now = datetime.now()
        
        # Find in-progress MAPs
        in_progress_maps = await db.maps.find({
            "status": {"$in": ["approved", "in_progress"]}
        }).to_list(None)
        
        stalled_maps = []
        for map_obj in in_progress_maps:
            last_activity = map_obj.get("last_activity_timestamp")
            time_since_activity = (now - last_activity).total_seconds() / 3600
            
            if time_since_activity > self.STALL_THRESHOLD_HOURS:
                stalled_maps.append({
                    "map_id": map_obj["_id"],
                    "current_step": map_obj["current_workflow_step"],
                    "assigned_to": map_obj["assigned_to"],
                    "hours_stalled": time_since_activity,
                    "deadline": map_obj["deadline"]
                })
        
        # Escalate each stalled MAP
        for stalled_map in stalled_maps:
            await self.escalate_stalled_map(stalled_map)
    
    async def escalate_stalled_map(self, stalled_map: dict):
        """Multi-level escalation"""
        map_id = stalled_map["map_id"]
        assigned_to = stalled_map["assigned_to"]
        hours_stalled = stalled_map["hours_stalled"]
        
        if hours_stalled < 72:
            # Level 1: Reminder to assignee
            await self.send_reminder(assigned_to, map_id)
            
        elif hours_stalled < 120:
            # Level 2: Alert to department manager
            department = await self.get_department(assigned_to)
            manager = await self.find_manager(department)
            await self.send_alert_to_manager(manager, map_id)
            
        else:
            # Level 3: Alert to CISO
            await self.send_alert_to_ciso(map_id)
            await self.create_escalation_ticket(map_id, "CRITICAL")
```

**Step 3: Predictive Completion Date**
```python
# services/completion_predictor.py
from sklearn.linear_model import LinearRegression
import numpy as np

class CompletionPredictor:
    async def predict_completion_date(self, map_obj: dict) -> datetime:
        """
        Uses historical data to predict when MAP will be completed
        """
        department = map_obj["assigned_to_department"]
        workflow_type = map_obj["workflow_type"]
        
        # Fetch historical MAPs for this department + workflow
        historical_maps = await db.maps.find({
            "assigned_to_department": department,
            "workflow_type": workflow_type,
            "status": "completed"
        }).to_list(None)
        
        if len(historical_maps) < 5:
            # Not enough data; use workflow-defined estimate
            return map_obj["deadline"]
        
        # Extract average duration
        durations = []
        for hist_map in historical_maps[-20:]:  # Last 20 completed MAPs
            created = hist_map["created_at"]
            completed = hist_map["completed_at"]
            duration_hours = (completed - created).total_seconds() / 3600
            durations.append(duration_hours)
        
        avg_duration = np.mean(durations)
        std_duration = np.std(durations)
        
        # Predicted completion: now + avg duration (with 1 std dev buffer)
        predicted_hours = avg_duration + std_duration
        predicted_completion = datetime.now() + timedelta(hours=predicted_hours)
        
        return predicted_completion
    
    async def predict_completion_risk(self, map_obj: dict) -> float:
        """
        Returns probability (0-1) that MAP will miss deadline
        """
        predicted_date = await self.predict_completion_date(map_obj)
        deadline = map_obj["deadline"]
        
        if predicted_date > deadline:
            # Will miss deadline
            risk_percentage = min(1.0, 0.5 + 0.5 * (
                (predicted_date - deadline).total_seconds() / 
                (deadline - datetime.now()).total_seconds()
            ))
            return risk_percentage
        else:
            return 0.0
```

**Step 4: Integration with Chat Platforms**
```python
# services/notification_service.py
async def send_reminder(user_id: str, map_id: str):
    """Send reminder via Teams/Slack"""
    map_obj = await db.maps.find_one({"_id": ObjectId(map_id)})
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Construct message
    message = f"""
    ⏰ **MAP Reminder**: {map_obj['title']}
    
    No progress detected in last 48 hours.
    
    Deadline: {map_obj['deadline'].strftime('%Y-%m-%d %H:%M')}
    Current Step: {map_obj['current_workflow_step']}
    
    [View in SuRaksha](https://suraksha-portal.bank.com/maps/{map_id})
    """
    
    # Send via MS Teams
    if user.get("teams_email"):
        await teams_client.send_message(
            to=user["teams_email"],
            subject=f"MAP Reminder: {map_obj['title']}",
            body=message
        )
```

**Step 5: Admin Dashboard Widget**
```
Completion Monitor Dashboard:
├── At-Risk MAPs (will miss deadline): 3
│   ├── MAP-001 (Cybersecurity Policy Update)
│   │   └─ Predicted completion: 2026-05-25 (deadline: 2026-05-24)
│   ├── MAP-002 (Data Classification Review)
│   │   └─ Predicted completion: 2026-05-28 (deadline: 2026-05-27)
│   └── MAP-003 (Vendor Audit Framework)
│       └─ Predicted completion: 2026-06-02 (deadline: 2026-05-31)
├── Stalled MAPs (no progress > 48 hours): 2
│   ├── MAP-005 (Legal Contract Review) - stalled 64 hours
│   └── MAP-007 (Operations Procedure Update) - stalled 52 hours
└── On-Track MAPs: 45
    └─ Avg days to completion: 3.2
```

**Metrics:**
- MAP on-time completion: 85% → 98%
- Average stall detection time: 60 hours → 48 hours (as-designed)
- Escalation effectiveness: 92% of escalated MAPs completed within 24 hours

---

## Phase 2: Advanced Graph Reasoning (Weeks 5–8)

### 2.1 Policy Inference Agent

**Current State:**
- Graph contains only explicit relationships mentioned in documents
- Example: Circular says "see Policy XYZ"; creates edge. If Circular doesn't mention Policy ABC, no edge is created, leading to false gaps.

**Goal:**
- LLM-powered agent infers missing relationships
- Reduces false gaps by 30–40%
- Human approves inferred edges before they enter graph

**Implementation Details:**

**Step 1: Inference Logic**
```python
# services/policy_inference_agent.py
from langchain.llms import Ollama
from langchain.tools import tool

class PolicyInferenceAgent:
    def __init__(self):
        self.llm = Ollama(model="llama2")  # Or Gemini API
    
    async def infer_related_policies(self, clause: dict) -> List[dict]:
        """
        Given a clause from a circular, infer related policies
        that may not be explicitly mentioned
        """
        
        # Get clause text and context
        clause_text = clause["text"]
        circular_title = clause["circular_title"]
        
        # Fetch all bank policies
        all_policies = await db.policies.find().to_list(None)
        policy_names_and_descriptions = [
            f"{p['name']}: {p['description']}" for p in all_policies
        ]
        
        # Construct prompt
        prompt = f"""
        You are a compliance expert at a bank. You are given a regulatory clause 
        and a list of internal policies. Your task is to infer which policies are 
        LIKELY related to this clause, even if not explicitly mentioned.
        
        CLAUSE:
        {clause_text}
        
        CIRCULAR: {circular_title}
        
        AVAILABLE POLICIES:
        {json.dumps(policy_names_and_descriptions, indent=2)}
        
        OUTPUT:
        Return a JSON array of inferred relationships:
        [
          {{
            "policy_name": "...",
            "inference_type": "likely_related|semantically_similar|prerequisite",
            "confidence": 0.85,
            "reasoning": "This policy covers...because..."
          }}
        ]
        
        Only include policies with confidence >= 0.7
        """
        
        # Call LLM
        response = await self.llm.ainvoke(prompt)
        inferred_relationships = json.loads(response)
        
        # Filter by confidence
        high_confidence = [
            r for r in inferred_relationships if r["confidence"] >= 0.7
        ]
        
        return high_confidence
```

**Step 2: Admin Review Queue**
```
Inferred Policy Relationships (Pending Review)
├─ Clause: "Data must be encrypted at rest"
│  └─ Inferred: Policy "Data Protection Standard v3.1" (confidence: 0.92)
│     [✓ Approve] [✗ Reject] [? Need Info]
├─ Clause: "Third-party vendor assessments required"
│  └─ Inferred: Policy "Vendor Management Framework" (confidence: 0.88)
│     [✓ Approve] [✗ Reject] [? Need Info]
└─ Clause: "Annual audit of access controls"
   └─ Inferred: Policy "Access Control Policy v2.0" (confidence: 0.78)
      [✓ Approve] [✗ Reject] [? Need Info]
```

**Step 3: Feedback Loop**
```python
# When officer approves/rejects an inference
async def record_inference_feedback(
    clause_id: str,
    inferred_policy_id: str,
    officer_decision: str  # "approve" | "reject"
):
    """
    Log feedback and update model calibration
    """
    
    # Create audit log
    await db.inference_audit_logs.insert_one({
        "clause_id": clause_id,
        "policy_id": inferred_policy_id,
        "decision": officer_decision,
        "officer_id": current_user.id,
        "timestamp": datetime.now(),
        "inference_confidence": inference["confidence"]
    })
    
    # Update inference calibration
    # If policy rejects inference where confidence was 0.92, 
    # lower future threshold for similar patterns
    if officer_decision == "reject":
        await self.calibrate_inference_threshold(
            policy_category=inferred_policy["category"],
            current_confidence=inference["confidence"],
            direction="lower"  # Lower threshold for next time
        )
```

**Step 4: Graph Mutation**
```python
# When inference is approved
async def add_inferred_relationship_to_graph(
    clause_id: str,
    policy_id: str,
    confidence: float,
    officer_id: str
):
    """
    Add inferred edge to Neo4j graph with metadata
    """
    
    query = """
    MATCH (c:Clause {id: $clause_id})
    MATCH (p:Policy {id: $policy_id})
    CREATE (c)-[r:INFERRED_REFERENCES {
      confidence: $confidence,
      inferred_at: datetime(),
      inferred_by: $officer_id,
      source: 'policy_inference_agent'
    }]->(p)
    RETURN r
    """
    
    await neo4j_driver.execute_query(
        query,
        clause_id=clause_id,
        policy_id=policy_id,
        confidence=confidence,
        officer_id=officer_id
    )
```

**Metrics:**
- False-negative gaps (from missing relationships): 40% → 10%
- Policy inference accuracy: 88% (with human-in-the-loop)
- Time to infer and approve relationships: 30 minutes per circular

---

### 2.2 Regulatory Intelligence Agent

**Current State:**
- System is reactive; waits for circulars to be uploaded
- 15–20 day lag from official issuance to internal awareness

**Goal:**
- Autonomous agent monitors RBI, SEBI, CERT-In websites and email newsletters
- Auto-downloads new circulars daily
- Flags potentially relevant circulars to compliance officer
- Officer decides: "ingest" or "dismiss"

**Implementation Details:**

**Step 1: Data Source Integration**
```python
# services/regulatory_watcher.py
from bs4 import BeautifulSoup
import httpx

class RegulatoryWatcher:
    async def monitor_rbi_website(self):
        """
        Scheduled job: runs daily at 06:00 AM
        Fetches latest RBI circulars from official website
        """
        async with httpx.AsyncClient() as client:
            # RBI publishes circulars at: https://www.rbi.org.in/scripts/notifications.aspx
            response = await client.get(
                "https://www.rbi.org.in/scripts/NotificationDetail.aspx?id=..."
            )
            html = response.text
            
            # Parse HTML to extract circular metadata
            soup = BeautifulSoup(html, "html.parser")
            circulars = self.parse_rbi_circulars(soup)
            
            # Filter: only new circulars (check against stored IDs)
            new_circulars = await self.filter_new_circulars(circulars)
            
            # Alert compliance officer for each new circular
            for circular in new_circulars:
                await self.alert_officer_of_new_circular(circular)
    
    async def monitor_sebi_notices(self):
        """
        Fetch SEBI notices from email subscription
        """
        # Connect to email (IMAP) and filter for SEBI notices
        # Extract new notices
        # Alert officer
        pass
    
    async def monitor_certin_alerts(self):
        """
        Fetch CERT-In security alerts from RSS feed
        """
        # Pull from https://www.cert-in.org.in/
        # Filter by bank-relevant topics
        # Alert officer
        pass
    
    def parse_rbi_circulars(self, soup: BeautifulSoup) -> List[dict]:
        """Extract circular metadata from HTML"""
        circulars = []
        for item in soup.find_all("div", class_="notification-item"):
            circular = {
                "title": item.find("h3").text,
                "date": item.find("span", class_="date").text,
                "download_url": item.find("a")["href"],
                "source": "RBI",
                "discovered_at": datetime.now()
            }
            circulars.append(circular)
        return circulars
```

**Step 2: Relevance Filtering**
```python
# Filter out irrelevant circulars (e.g., address changes, form updates)
class RelevanceFilter:
    IGNORE_KEYWORDS = [
        "holiday schedule",
        "office address change",
        "staff transfer",
        "form revision",
        "clarification only",
        "withdrawn",
        "superseded"
    ]
    
    async def is_relevant(self, circular: dict) -> bool:
        """Check if circular is relevant to compliance"""
        title = circular["title"].lower()
        
        for keyword in self.IGNORE_KEYWORDS:
            if keyword in title:
                return False
        
        # Check against semantic similarity to known compliance areas
        relevance_score = await self.semantic_relevance_check(circular)
        return relevance_score > 0.6
```

**Step 3: Officer Alert with Context**
```
New Regulatory Circular Detected

Title: RBI Circular on Cybersecurity Framework Enhancement (DFS/DBR 2026-123)
Source: RBI
Date: 2026-05-20
Relevance Score: 0.94 (High)

Summary: This circular clarifies requirements for multi-factor authentication 
and incident response procedures. It may impact your existing policies:
- Policy 4: "Access Control & MFA"
- Policy 7: "Incident Response Procedures"

[View Full Circular] [Ingest into SuRaksha] [Dismiss] [Archive]
```

**Step 4: Integration into Workflow**
```python
async def alert_officer_of_new_circular(self, circular: dict):
    """Send alert and create intake task"""
    
    # 1. Fetch relevant internal policies (via semantic search)
    relevant_policies = await self.find_relevant_policies(circular)
    
    # 2. Create alert notification
    alert = {
        "circular_id": circular["download_url"],  # unique identifier
        "title": circular["title"],
        "source": circular["source"],
        "discovered_at": datetime.now(),
        "relevance_score": circular["relevance_score"],
        "related_policies": relevant_policies,
        "status": "pending_review",
        "officer_assigned": await self.assign_to_officer()  # Round-robin
    }
    await db.regulatory_alerts.insert_one(alert)
    
    # 3. Send notification (Teams, email, in-app)
    await self.send_multi_channel_notification(
        officer_id=alert["officer_assigned"],
        alert=alert
    )
```

**Step 5: Integration with Gap Detection**
```python
# When officer clicks "Ingest", trigger full pipeline
async def ingest_alert(alert_id: str):
    """Officer clicks 'Ingest' → full parsing & gap detection"""
    
    alert = await db.regulatory_alerts.find_one({"_id": ObjectId(alert_id)})
    
    # 1. Download circular
    circular_file = await download_from_url(alert["circular_id"])
    
    # 2. Upload to SuRaksha as if manually uploaded
    circular = await upload_circular(
        file=circular_file,
        title=alert["title"],
        source=alert["source"],
        uploaded_by="regulatory_intelligence_agent",
        auto_discovered=True
    )
    
    # 3. Trigger parsing pipeline
    await trigger_parsing_pipeline(circular["_id"])
    
    # 4. Mark alert as ingested
    await db.regulatory_alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": "ingested", "ingested_at": datetime.now()}}
    )
```

**Metrics:**
- Time from regulatory issuance to bank awareness: 15–20 days → <24 hours
- False-positive alert rate: <5%
- Officer action rate (ingest vs dismiss): 85% ingest, 15% dismiss (as expected)

---

### 2.3 Cross-Regulatory Policy Synchronization

**Current State:**
- Gap detection runs per regulatory domain (RBI, SEBI, CERT-In separately)
- Conflicts between regulations (e.g., RBI requires 6-year log retention, SEBI requires 3-year) not detected
- Policies don't reconcile conflicting requirements

**Goal:**
- Agent detects conflicts across regulatory domains
- Alerts compliance officer to reconcile policies
- Ensures most stringent requirement (6-year retention) is enforced

**Implementation Details:**

**Step 1: Regulatory Constraint Extraction**
```python
# Identify constraints (e.g., log retention period, encryption standard) from each regulation
class ConstraintExtractor:
    CONSTRAINT_TYPES = {
        "data_retention_period": {
            "units": ["days", "months", "years"],
            "description": "How long to retain customer/transaction data"
        },
        "encryption_standard": {
            "values": ["AES-128", "AES-256", "RSA-2048", "TLS-1.2", "TLS-1.3"],
            "description": "Minimum encryption algorithm"
        },
        "audit_trail_retention": {
            "units": ["days", "months", "years"],
            "description": "Audit log retention period"
        },
        "incident_response_time": {
            "units": ["hours", "days"],
            "description": "Time to detect and respond to security incident"
        },
        "mfa_requirement": {
            "values": ["true", "false", "conditional"],
            "description": "Multi-factor authentication required"
        }
    }
    
    async def extract_constraints_from_circular(self, circular_id: str) -> List[dict]:
        """
        Use LLM to extract constraint requirements from circular
        """
        circular = await db.circulars.find_one({"_id": ObjectId(circular_id)})
        
        prompt = f"""
        You are a regulatory compliance expert. Extract all technical/operational 
        constraints from this RBI/SEBI/CERT-In circular.
        
        CIRCULAR TEXT:
        {circular['parsed_text']}
        
        For each constraint found, return:
        {{
          "constraint_type": "data_retention_period|encryption_standard|...",
          "requirement": "Retain for 6 years|Use AES-256|...",
          "applicability": "All banks|Large banks|...",
          "effective_date": "2026-06-01",
          "source_paragraph": "Section 3.2"
        }}
        """
        
        response = await llm.ainvoke(prompt)
        constraints = json.loads(response)
        return constraints
```

**Step 2: Conflict Detection**
```python
# services/regulatory_conflict_detector.py
class ConflictDetector:
    async def detect_conflicts_across_domains(self) -> List[dict]:
        """
        Compare constraints from RBI vs SEBI vs CERT-In
        Flag conflicts
        """
        
        # Get all constraints grouped by domain
        constraints_by_domain = await self.get_constraints_by_domain()
        # e.g.:
        # {
        #   "RBI": [{ type: "data_retention", requirement: "6 years" }],
        #   "SEBI": [{ type: "data_retention", requirement: "3 years" }],
        #   "CERT-In": [{ type: "data_retention", requirement: "1 year" }]
        # }
        
        conflicts = []
        
        # Check each constraint type across domains
        for constraint_type in self.CONSTRAINT_TYPES:
            domain_requirements = {}
            for domain, domain_constraints in constraints_by_domain.items():
                matching = [c for c in domain_constraints if c["type"] == constraint_type]
                if matching:
                    domain_requirements[domain] = matching
            
            # Detect conflicts
            if len(domain_requirements) > 1:
                conflict = await self.compare_requirements(
                    constraint_type=constraint_type,
                    domain_requirements=domain_requirements
                )
                if conflict["has_conflict"]:
                    conflicts.append(conflict)
        
        return conflicts
    
    async def compare_requirements(self, constraint_type: str, domain_requirements: dict) -> dict:
        """
        Compare requirements across domains
        """
        
        if constraint_type == "data_retention_period":
            # Extract numeric values
            periods = {}
            for domain, requirements in domain_requirements.items():
                # Parse "Retain for 6 years" → 6 (in years)
                period_value = await self.parse_period(requirements[0]["requirement"])
                periods[domain] = period_value
            
            # Find most stringent (highest retention)
            most_stringent = max(periods.values())
            conflicting_domains = [d for d, v in periods.items() if v < most_stringent]
            
            if conflicting_domains:
                return {
                    "has_conflict": True,
                    "constraint_type": constraint_type,
                    "domain_requirements": domain_requirements,
                    "most_stringent": f"{most_stringent} years",
                    "conflicting_domains": conflicting_domains,
                    "recommendation": f"Adopt most stringent: {most_stringent} years retention"
                }
        
        elif constraint_type == "encryption_standard":
            # Compare encryption algorithms
            standards = {}
            strength_rank = {"AES-128": 1, "AES-256": 2, "RSA-2048": 3}  # simplified
            for domain, requirements in domain_requirements.items():
                standards[domain] = requirements[0]["requirement"]
            
            # Find most stringent
            most_stringent = max(standards.values(), key=lambda x: strength_rank.get(x, 0))
            
            if not all(s == most_stringent for s in standards.values()):
                return {
                    "has_conflict": True,
                    "constraint_type": constraint_type,
                    "domain_requirements": domain_requirements,
                    "most_stringent": most_stringent,
                    "recommendation": f"Adopt most stringent: {most_stringent}"
                }
        
        return {"has_conflict": False}
```

**Step 3: Conflict Alert in Admin Portal**
```
Regulatory Conflicts Detected

⚠️ Data Retention Period
├─ RBI Requirement: 6 years
├─ SEBI Requirement: 3 years
├─ CERT-In Requirement: 1 year
└─ Recommendation: Adopt most stringent (6 years)
   Current Policy: "Data Retention Standard" (3 years) ❌ NON-COMPLIANT with RBI
   [Update Policy to 6 years] [Dismiss Conflict]

⚠️ Incident Response Time
├─ CERT-In Requirement: 24 hours
├─ RBI Requirement: 72 hours
└─ Recommendation: Adopt 24 hours (most stringent)
   Current Policy: "Incident Response" (48 hours) ⚠️ NEEDS UPDATE
   [Update Policy to 24 hours] [Dismiss Conflict]
```

**Step 4: Automatic Policy Reconciliation**
```python
async def reconcile_conflict(conflict_id: str, officer_decision: str):
    """
    Officer clicks "Update Policy" → system updates policy to most stringent
    """
    
    conflict = await db.regulatory_conflicts.find_one({"_id": ObjectId(conflict_id)})
    
    if officer_decision == "accept_recommendation":
        # Update policy with most stringent requirement
        policy = await db.policies.find_one({
            "_id": ObjectId(conflict["affected_policy_id"])
        })
        
        # Create new policy version
        new_version = policy["version"] + 1
        
        updated_policy = {
            **policy,
            "version": new_version,
            "previous_version_id": policy["_id"],
            requirement_field: conflict["most_stringent"],
            "updated_at": datetime.now(),
            "updated_by": current_user.id,
            "update_reason": f"Reconcile regulatory conflict: {conflict['constraint_type']}"
        }
        
        # Store updated policy
        result = await db.policies.insert_one(updated_policy)
        
        # Update Graph
        cypher_query = """
        MATCH (p:Policy {id: $old_policy_id})
        SET p.version = $new_version
        CREATE (p)-[:UPDATED_TO {
            timestamp: datetime(),
            reason: $reason
        }]->(p_new {id: $new_policy_id, version: $new_version})
        """
        
        # Log reconciliation
        await db.reconciliation_audit_logs.insert_one({
            "conflict_id": conflict_id,
            "policy_id": conflict["affected_policy_id"],
            "decision": officer_decision,
            "timestamp": datetime.now(),
            "officer_id": current_user.id,
            "new_policy_version": new_version
        })
```

**Metrics:**
- Regulatory conflicts detected per quarter: 3–5 (previously unknown)
- Conflict resolution time: <1 hour (vs. days of manual research)
- Policy compliance with most stringent regulatory requirement: 100%

---

## Phase 3: Employee Behavioral Biometrics Enhancement (Weeks 9–12)

### 3.1 Quarterly Baseline Refresh Automation

**Implementation:**
- Scheduler triggers baseline refresh every 90 days
- Recommendation: "Your behavioral baseline is 92 days old; refresh recommended"
- One-click refresh: next 5 minutes of natural interaction sampled
- Tracks baseline drift over time (e.g., typing speed changes)

**Database Schema:**
```javascript
db.behavioral_baselines.insertOne({
  user_id: ObjectId("..."),
  baseline_version: 1,
  created_at: ISODate("2026-02-21T10:00:00Z"),
  refresh_scheduled_at: ISODate("2026-05-21T10:00:00Z"),
  signals: {
    keystroke_timing: {
      avg_inter_key_time_ms: 85,
      std_dev: 12,
      percentile_95: 110
    },
    mouse_dynamics: {
      avg_velocity: 450,
      avg_acceleration: 200
    },
    device_fingerprint: "...",
    geo_baseline: ["Bangalore office", "Home"],
    time_of_day_pattern: [{ hour_range: "08-10", probability: 0.95 }]
  },
  drift_indicators: [
    { date: ISODate("2026-04-21"), keystroke_drift_pct: 5 },
    { date: ISODate("2026-05-01"), keystroke_drift_pct: 8 }
  ]
})
```

---

### 3.2 Smart RBAC Onboarding

**Implementation:**
- New hire: system suggests role based on department + seniority
- Infers behavioral baseline profile: "Leadership roles have slower typing, more deliberate clicks"
- Admin approves suggested role + permissions
- Feedback loop: if officer rejects suggestions, model learns for next hire

---

### 3.3 Continuous Session Monitoring

**Implementation:**
- Background service samples behavior every 30 minutes
- Detects subtle anomalies: "Typing faster than usual + new geo + off-hours = soft anomaly"
- Soft challenge (behavioral proof) → escalates to OTP if suspicious
- Never blocks without soft challenge first

---

## Phase 4: Regulatory Forecasting & Prediction (Weeks 13–16)

### 4.1 Regulatory Change Forecasting

**Goal:** Predict regulatory changes 3–6 months ahead

**Implementation:**
- NLP model analyzes historical trends (2015–2025 RBI circulars)
- Identifies patterns: "Cybersecurity circulars increase every Q2"
- Forecast: "Expect new Data Residency circular Q3 2026"
- Compliance officers proactively draft policies before official announcement

---

### 4.2 Policy Lifecycle Automation

**Goal:** Recommend policy deprecation based on regulatory sunset clauses

**Implementation:**
- Agent monitors: policy age, MAP count, regulatory references
- Recommendation: "Policy 'Old Audit Standard' can be archived; replace with 'New Audit Framework'"
- One-click archival: system auto-archives, updates graph

---

## Summary: Prototyping Phase Impact

| Phase | Feature | Automation % | Time Saved | Business Value |
|-------|---------|--------------|-----------|-----------------|
| 1 | Evidence Auto-Collection | 80% | 1.9 hr/MAP | $150K/year |
| 1 | Workflow Templates | 100% | 2 weeks dev cycle | $100K/year |
| 1 | Completion Monitoring | 95% | 2 hr/week escalation | $80K/year |
| 2 | Policy Inference | 40% | 3 hr/circular | $120K/year |
| 2 | Regulatory Monitoring | 100% | 8 hr/week | $200K/year |
| 2 | Conflict Detection | 100% | 4 hr/conflict | $60K/year |
| 3 | Behavioral Baseline | 90% | 30 min/quarter/user | $50K/year |
| 4 | Forecasting | 50% | 40 hr/quarter planning | $100K/year |
| | **Total** | **~85%** | **~15 FTE/year** | **$860K/year** |

---

**End of Prototyping Phase Roadmap**
