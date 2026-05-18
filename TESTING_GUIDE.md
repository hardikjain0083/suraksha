# Testing Guide for SuRaksha MAPS v4.0

This guide explains how to test the application from start to finish, including the seeded user credentials and an example testing flow.

## 1. Seeded User Credentials

The database is pre-seeded with 6 accounts covering the main roles. 
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

## 2. End-to-End Testing Flow

Follow these steps to experience the full ingestion-to-triage workflow.

### Step 1: Login
1. Start the backend and frontend servers (see `SETUP.md`).
2. Navigate to the frontend URL (e.g., `http://localhost:5173`).
3. Click **Get Started** and log in using the Admin credentials:
   - **ID:** `EMP-INFOSEC-001`
   - **Password:** `Demo@123`
4. You will be successfully authenticated and routed to the main Dashboard.

### Step 2: Upload a Regulatory Circular
1. In the sidebar, navigate to **Circulars** -> **Upload Circular**.
2. We have provided a sample circular file: `rbi_circular_demo.txt` in the root of the project.
3. Drag and drop `rbi_circular_demo.txt` into the upload zone.
4. The system will ingest the file, extract the text, and identify obligations (clauses).
5. Wait for the status to change to "Fully Parsed" or check the **Circular Board**.

### Step 3: Run Gap Detection
1. Navigate to **Gap Detection** in the sidebar.
2. Select the circular you just uploaded from the dropdown menu.
3. Click **Run Gap Detection**.
4. The engine will evaluate the extracted clauses against mock internal policies. It will categorize clauses as *Covered*, *Suspected Gap*, or *Confirmed Gap*.

### Step 4: Triage & Validation
1. Click on any identified "Gap" from the detection results to open the Gap Detail Modal.
2. Review the details and click **Approve** (this confirms the gap requires action).
3. Navigate to the **Triage Queue** in the sidebar. You will see the newly identified gaps awaiting final human sign-off.
4. Approving it from the Triage Queue converts it into an active Multi-Agent Path (MAP) task assigned to the respective department (e.g., IT).

### Step 5: Department View Verification (Optional)
1. Log out from the Admin account.
2. Log in using the IT Lead credentials (`EMP-IT-001` / `Demo@123`).
3. Verify that the dashboard is restricted to the IT department view, and they can see the tasks assigned to them from the Triage process.

By following these steps, you will verify the primary functionality of the SuRaksha MAPS platform!
