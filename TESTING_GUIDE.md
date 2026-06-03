# Testing Guide for SuRaksha MAPS v4.0

This guide explains how to test the application from start to finish, including the seeded user credentials, the primary testing flow, and verification instructions for each newly implemented compliance and orchestration feature.

---

## 1. Seeded User Credentials

The database is pre-seeded with accounts covering the main roles.
**Password for all accounts:** `Demo@123`

| Role / Department      | Employee ID       | Password   | Access Level        |
| :--------------------- | :---------------- | :--------- | :------------------ |
| **Admin (CISO)**       | `EMP-INFOSEC-001` | `Demo@123` | Full Admin          |
| **Compliance Officer** | `EMP-COMP-001`    | `Demo@123` | Admin / Circulars   |
| **IT Lead**            | `EMP-IT-001`      | `Demo@123` | Dept Portal         |
| **Legal Head**         | `EMP-LEGAL-001`   | `Demo@123` | Dept Portal         |
| **Ops Head**           | `EMP-OPS-001`     | `Demo@123` | Dept Portal         |
| **Risk Officer**       | `EMP-RISK-001`    | `Demo@123` | Dept Portal         |

*Note: You can also use the "Register" button on the login page to create a new user dynamically.*

---

## 2. End-to-End Primary Flow

Follow these steps to experience the standard ingestion-to-triage workflow.

### Step 1: Login
1. Start the backend and frontend servers (see `SETUP.md`).
2. Navigate to the frontend URL (`http://localhost:5173`).
3. Log in using the Admin credentials:
   - **ID:** `EMP-INFOSEC-001`
   - **Password:** `Demo@123`

### Step 2: Upload a Circular
1. In the sidebar, navigate to **Circulars** -> **Upload Circular**.
2. Drag and drop the provided sample file `rbi_circular_demo.txt` (located in the project root) into the upload area.
3. The system will parse the circular and identify obligations.

### Step 3: Run Gap Detection
1. Navigate to **Gap Detection** in the sidebar.
2. Select the uploaded circular and click **Run Gap Detection**.
3. The engine will match clauses against policy files and highlight gaps.

### Step 4: Triage & Approval
1. Navigate to the **Triage Queue** (under Admin menu).
2. Approve the identified gaps to convert them into Multi-Agent Path (MAP) tasks.

---

## 3. Verifying Advanced Features & Edge Cases

Each of the following features has been integrated and should be validated using these procedures.

### Feature 1: Content-Based CERT-In Ingestion
Detects if an advisory was issued by CERT-In using body-text signatures, even when the filename is anonymous.
- **Where to verify:** **Circulars** -> **Upload Circular**.
- **Steps:**
  1. Create a text file named `random_doc_392.txt` (avoiding "CERT-In" or "CIAD" in the filename).
  2. Paste standard CERT-In headers inside the file, e.g.:
     ```text
     INDIAN COMPUTER EMERGENCY RESPONSE TEAM (CERT-In)
     Advisory ID: CIAD-2026-0099
     Subject: Vulnerabilities in Windows Kernel
     ```
  3. Upload the file.
- **Edge Cases to Test:**
  - **No CERT-In Signatures:** Uploading a generic circular should result in the issuer being classified as "RBI" or "SEBI" (or "Generic").
  - **Scanned Text Fallback (OCR):** Upload an image-only PDF containing CERT-In headers. The background OCR worker will run pytesseract and retrieve the text to determine the CERT-In issuer.

---

### Feature 2: Advisory-to-Asset Correlation & CVE Feed
Correlates identified threats with internal systems and links CVE IDs with live CVSS/EPSS scoring statistics.
- **Where to verify:** **Dashboard** / **MAPs** / **Triage Queue**.
- **Steps:**
  1. Upload a text advisory containing CVE IDs (e.g., `CVE-2026-1020`) and system names (e.g., "Tomcat Server", "Windows OS").
  2. View the generated MAP or Gap detail card. Under **Provenance**, observe the list of correlated assets mapped from the database inventory (e.g. "Internet Banking Portal", "Internal HR System").
- **Edge Cases to Test:**
  - **CVE Not in Feed:** If a clause references an unlisted CVE (e.g. a brand new advisory), the correlator uses a deterministic fallback hashing algorithm to assign realistic baseline CVSS and EPSS scores instead of crashing.
  - **Multiple Matches:** Mention multiple software names (e.g., "PostgreSQL" and "Linux Kernel"). Ensure the asset list shows multiple matching servers.

---

### Feature 3: Configurable CISO Escalation Rules
Escalates critical risk exposure directly to the CISO using configurable database rules.
- **Where to verify:** **Triage Queue** / **Circular Board** / Database collection `escalation_rules`.
- **Steps:**
  1. Ingest a CERT-In advisory mentioning `CVE-2026-2002` (Critical severity) that maps to `Internet Banking Portal` (classified as `sensitivity: critical` with `category: sensitive_customer_data` in the database).
  2. Observe the generated MAP status: it will immediately bypass default drafting and set its status to `"escalated"` to flag CISO attention.
- **Edge Cases to Test:**
  - **High Severity + Low Sensitivity Asset:** Test an advisory with critical severity that correlates with `Internal HR Portal` (low sensitivity, operational category). It should remain in `"draft"` status rather than escalating.
  - **Low Severity + Sensitive Asset:** Test a Low severity vulnerability on `Internet Banking Portal`. It should not trigger CISO escalation.

---

### Feature 4: 6-Hour Incident Reporting SLA & Monitor
CERT-In regulations require incident report drafts to be filed within 6 hours of discovery.
- **Where to verify:** **Admin** -> **Incidents** (Incident Reports panel).
- **Steps:**
  1. Upload a CERT-In advisory.
  2. A Form 1 Incident draft is automatically created.
  3. Go to the **Incidents Dashboard** to view the active 6-hour SLA Countdown timer.
  4. Submit/dispatch the incident report before the timer hits zero.
- **Edge Cases to Test:**
  - **SLA Breach Monitoring:** If the draft is left un-submitted for over 6 hours, the background `incident_monitor` task executes a sweep, flags the incident as `breached`, and generates a high-severity alert anomaly.
  - **Form Validation:** Try to submit the incident report with missing mandatory CERT-In Form 1 fields (e.g., missing reporting organization name). The API will return validation errors.

---

### Feature 5: Dedicated MTTR Performance Dashboard
Aggregates and monitors Mean Time To Remediation (MTTR) performance metrics, comparing security-type MAPs with operational-type MAPs.
- **Where to verify:** **Admin** -> **MTTR Dashboard** (`/admin/mttr`).
- **Steps:**
  1. View the chart graphs showing the MTTR average hours, completed count, and SLA adherence rate.
  2. Complete some assigned security MAPs (upload evidence and mark as complete) and observe the hours decrease.
- **Edge Cases to Test:**
  - **Zero Completed Tasks:** When there are zero completed MAPs, the dashboard handles division by zero gracefully, displaying `0.0 hours` and `100.0%` SLA adherence rates safely.
  - **Varying SLA Deadlines:** Verify that SLA compliance is based on the dynamic SLAs (3-day critical, 7-day high, etc.) rather than a hardcoded 45-day window.

---

### Feature 6: Real Graph Health Diagnostics
Executes real-time database queries to verify integrity across the compliance map relationship trees.
- **Where to verify:** **Admin** -> **Graph Diagnostics** (`/admin/graph-health`).
- **Steps:**
  1. View the interactive SVG Network Graph.
  2. View the counts for **Orphaned Nodes**, **Stale Edges**, and **Embedding Drift**.
- **Edge Cases to Test:**
  - **Orphan Clause:** Insert a clause into the database without mapping it to any policy. The Orphaned Nodes counter should increment, and the node will highlight.
  - **Stale Edge:** Link a policy to a circular that has been archived or deleted. The Stale Edges check will catch the discrepancy immediately.
  - **Embedding Drift:** Compares the cosine similarity between the text embeddings of a policy and its linked circular clause. If a policy is heavily updated without updating the compliance link, the drift score increases and will trigger a diagnostic alert.
