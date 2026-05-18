# SuRaksha MAPS v4.0

> **AI-Powered Cybersecurity Compliance Platform** — Automating regulatory ingestion, gap detection, and multi-agent remediation for financial institutions.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 📖 Project Overview

**SuRaksha MAPS v4.0** (Multi-Agent Policy System) is an enterprise-grade, AI-powered cybersecurity compliance platform built for financial institutions navigating complex regulatory environments (such as RBI circulars, ISO 27001, and similar mandates).

The platform ingests regulatory documents, uses **semantic vector search** to detect compliance gaps against existing internal policies, and routes remediation tasks to the correct department through an automated **Multi-Agent Path (MAP)** workflow — all secured behind a **Zero-Trust Role-Based Access Control (RBAC)** system.

**Tech Stack:** React 19 + TypeScript + Vite (Frontend) · FastAPI + Python 3.10 (Backend) · MongoDB Atlas / Local MongoDB (Database) · Sentence Transformers / `all-MiniLM-L6-v2` (AI/ML)

---

## ⚡ Platform Flow

```
User Login (Zero-Trust RBAC)
       │
       ▼
Compliance Officer uploads Circular (PDF / TXT)
       │
       ▼
AI Parser extracts clauses & obligations
       │
       ▼
Gap Detector compares clauses vs. internal policies (Vector Search)
       │
       ├── ✅ Covered      → No action needed
       ├── ⚠️  Suspected Gap → Sent to Triage Queue
       └── ❌ Confirmed Gap → Sent to Triage Queue
                │
                ▼
         Human Triage & Validation (Approve / Dismiss / Escalate)
                │
                ▼
         MAP created → Routed to Department (IT / Legal / Risk / Ops)
```

1. **Authentication & Zero-Trust RBAC** — Users log in and are securely routed to department-specific dashboards.
2. **Regulatory Ingestion (Watcher)** — Compliance Officers upload PDF or TXT circulars. The system parses text, tables, and regulatory clauses automatically.
3. **Gap Detection** — Parsed clauses are compared against existing internal policies using vector similarity search and NLP to classify coverage.
4. **Triage & Validation** — Identified gaps enter a Triage Queue for human review. Authorized users can approve, dismiss, or escalate.
5. **Multi-Agent Path (MAP) Creation** — Approved gaps are automatically converted into MAPs, routing tasks to the relevant department for remediation.

---

## 📁 Repository Structure

```
suraksha/
├── backend/                  # FastAPI Python backend
│   ├── api/                  # Route handlers (auth, circulars, gaps, maps…)
│   ├── core/                 # Security, auth middleware
│   ├── models/               # Pydantic data models
│   ├── services/             # Business logic & gap detection engine
│   ├── main.py               # FastAPI application entry point
│   ├── database.py           # MongoDB connection
│   ├── config.py             # Environment config
│   ├── setup_atlas.py        # DB collection & index initialiser
│   ├── seed_database.py      # Primary seeder (users, policies, circulars)
│   ├── seed_maps.py          # Seeds MAP tasks and triage data
│   ├── seed_policies.py      # Seeds internal compliance policies
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── contexts/         # AuthContext, global state
│   │   ├── pages/            # Route-level page components
│   │   └── index.css         # Global styles
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                     # Developer documentation
├── mock-data/                # JSON fixtures for testing
├── .env.example              # Template for environment variables
├── docker-compose.yml        # Docker setup (optional)
├── SETUP.md                  # Quick setup reference
├── TESTING_GUIDE.md          # End-to-end testing walkthrough
└── rbi_circular_demo.txt     # Sample regulatory circular for demo
```

---

## 🛠️ Prerequisites

Ensure the following tools are installed on your machine before proceeding:

| Tool | Required Version | Check Command |
|------|-----------------|---------------|
| **Node.js** | v18 or higher | `node --version` |
| **npm** | v9 or higher (bundled with Node) | `npm --version` |
| **Python** | v3.10 or higher | `python --version` |
| **pip** | Latest recommended | `pip --version` |
| **MongoDB** | Local instance **or** Atlas cloud URI | `mongod --version` |
| **Git** | Any recent version | `git --version` |

> **MongoDB options:**
> - **Local**: Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) and ensure the service is running on `localhost:27017`.
> - **Atlas (Cloud)**: Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com) and obtain your connection string (`mongodb+srv://...`).

---

## 🔐 Environment Variable Setup

### Backend — `backend/.env`

Create a file named `.env` inside the `backend/` directory. You can copy and edit the provided example:

```powershell
# Windows PowerShell — from the backend/ directory
Copy-Item ..\\.env.example .env
```

Then open `.env` and configure:

```env
# ─── Database ───────────────────────────────────────────────
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/suraksha_maps

# Option B: MongoDB Atlas (replace with your real connection string)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/suraksha_maps?retryWrites=true&w=majority

# ─── Authentication ─────────────────────────────────────────
JWT_SECRET=your-secure-random-jwt-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ─── CORS ────────────────────────────────────────────────────
BACKEND_CORS_ORIGINS=["http://localhost:5173"]

# ─── Application ─────────────────────────────────────────────
ENVIRONMENT=development
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Set to true to enable demo mode (relaxed validations for judges)
DEMO_MODE=true
```

### Frontend — `frontend/.env.development`

Create a file named `.env.development` inside the `frontend/` directory:

```env
# Points the frontend at the local FastAPI backend
VITE_API_URL=http://localhost:8000
VITE_DEMO_MODE=true
```

---

## 🚀 Local Setup & Run Guide

> **Recommended:** Use **3 separate terminal windows** — one for the backend, one for the frontend, and one for database seeding or ad-hoc scripts.

---

### Terminal 1 — Backend Server

**Step 1: Navigate to the backend directory**
```powershell
cd "suraksha\backend"
```

**Step 2: Create the Python virtual environment** *(first time only)*
```powershell
python -m venv venv
```

**Step 3: Activate the virtual environment**

*PowerShell:*
```powershell
.\venv\Scripts\Activate.ps1
```
> ⚠️ If you see a script execution policy error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
> ```

*Command Prompt (CMD):*
```cmd
.\venv\Scripts\activate.bat
```

Once activated, your prompt will show `(venv)` as a prefix — e.g., `(venv) PS C:\...\backend>`.

**Step 4: Upgrade pip and install dependencies** *(first time only)*
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

> 📦 This installs FastAPI, Motor (async MongoDB driver), Sentence Transformers, PyPDF2, pdfplumber, python-jose, and all other backend dependencies. The first install may take a few minutes.

**Step 5: Start the backend server**
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ The backend is now running:
| Endpoint | URL |
|----------|-----|
| API Base | `http://localhost:8000` |
| Interactive Docs (Swagger) | `http://localhost:8000/docs` |
| ReDoc | `http://localhost:8000/redoc` |
| Health Check | `http://localhost:8000/health` |

---

### Terminal 2 — Frontend Dev Server

**Step 1: Navigate to the frontend directory**
```powershell
cd "suraksha\frontend"
```

**Step 2: Install Node packages** *(first time only)*
```powershell
npm install
```

**Step 3: Start the Vite development server**
```powershell
npm run dev
```

✅ The frontend is now running:
| Endpoint | URL |
|----------|-----|
| Application | `http://localhost:5173` |

> Vite features **Hot Module Replacement (HMR)** — your browser will automatically reflect code changes without a full page reload.

---

### Terminal 3 — Database Setup & Seeding

Run these commands **once** after the backend is configured to populate the database with all demo data, users, and policies.

**Step 1: Ensure your virtual environment is active**
```powershell
cd "suraksha\backend"
.\venv\Scripts\Activate.ps1
```

**Step 2: Initialise MongoDB collections and indexes**
```powershell
python setup_atlas.py
```

This script:
- Connects to your MongoDB instance using `MONGODB_URI` from `.env`
- Creates all required collections (`users`, `circulars`, `gaps`, `policies`, `maps`, etc.)
- Builds standard indexes and vector search indexes for semantic gap detection

**Step 3: Seed users, policies, and circulars**
```powershell
python seed_database.py
```

**Step 4: Seed MAP tasks and triage data** *(optional, for a fully pre-populated demo)*
```powershell
python seed_maps.py
```

**Step 5: Seed internal compliance policies** *(optional, for richer gap detection)*
```powershell
python seed_policies.py
```

> 🤖 **AI Model Download**: The first time gap detection runs, the backend will automatically download the `sentence-transformers/all-MiniLM-L6-v2` model (~120 MB). Ensure you have an active internet connection on first run.

---

## 🗂️ Database Setup — Detailed Reference

| Script | Purpose |
|--------|---------|
| `setup_atlas.py` | Creates collections, indexes, and vector search indexes. **Run first, run once.** |
| `seed_database.py` | Seeds all demo users (6 roles), mock circulars, internal policies, and initial gaps. |
| `seed_maps.py` | Seeds MAP remediation tasks and triage queue items for a complete demo. |
| `seed_policies.py` | Seeds a richer set of internal compliance policy documents for gap detection. |
| `seed_users_only.py` | Seeds only the user accounts (useful if re-seeding after a partial wipe). |

---

## 👤 Demo Credentials

After seeding, the following accounts are available. All share the same password:

**Password for all demo accounts: `Demo@123`**

| Role | Employee ID | Access Level |
|------|-------------|--------------|
| **Admin (CISO)** | `EMP-INFOSEC-001` | Full admin — all dashboards, triage, gap management |
| **Compliance Officer** | `EMP-COMP-001` | Admin panel, circular uploads, gap detection |
| **IT Lead** | `EMP-IT-001` | IT department portal, assigned MAP tasks |
| **Legal Head** | `EMP-LEGAL-001` | Legal department portal, assigned MAP tasks |
| **Operations Head** | `EMP-OPS-001` | Operations portal, assigned MAP tasks |
| **Risk Officer** | `EMP-RISK-001` | Risk department portal, assigned MAP tasks |

> 💡 You can also register a new account directly from the **Register** button on the login page.

---

## 🌐 Default Ports

| Service | Port | URL |
|---------|------|-----|
| **Frontend** (Vite dev server) | `5173` | `http://localhost:5173` |
| **Backend** (FastAPI / Uvicorn) | `8000` | `http://localhost:8000` |
| **MongoDB** (local instance) | `27017` | `mongodb://localhost:27017` |

---

## 📚 API Documentation

The FastAPI backend auto-generates interactive API documentation. No additional tools needed — just visit:

- **Swagger UI** (recommended): [`http://localhost:8000/docs`](http://localhost:8000/docs) — Explore and execute all API endpoints directly in the browser.
- **ReDoc**: [`http://localhost:8000/redoc`](http://localhost:8000/redoc) — Clean, read-only reference documentation.
- **OpenAPI JSON**: [`http://localhost:8000/openapi.json`](http://localhost:8000/openapi.json) — Raw schema for tooling integration.

---

## 🖥️ Recommended Terminal Layout

For the smoothest development experience, open **3 terminal windows side by side**:

```
┌─────────────────────────┬─────────────────────────┬──────────────────────────┐
│   Terminal 1 (Backend)  │  Terminal 2 (Frontend)  │   Terminal 3 (DB/Tools)  │
│─────────────────────────│─────────────────────────│──────────────────────────│
│ cd backend              │ cd frontend             │ cd backend               │
│ .\venv\Scripts\...      │ npm install             │ .\venv\Scripts\...       │
│ uvicorn main:app ...    │ npm run dev             │ python setup_atlas.py    │
│                         │                         │ python seed_database.py  │
│  ✅ http://localhost:8000 │  ✅ http://localhost:5173 │  ✅ DB seeded & ready    │
└─────────────────────────┴─────────────────────────┴──────────────────────────┘
```

---

## ✅ Final Development Workflow (End-to-End)

Follow these steps for a complete demo run from a clean state:

**1. Start MongoDB** (if running locally)
```powershell
# In a separate terminal or as a Windows service
mongod --dbpath "C:\data\db"
```

**2. Start the Backend** (Terminal 1)
```powershell
cd suraksha\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**3. Seed the Database** (Terminal 3 — first time only)
```powershell
cd suraksha\backend
.\venv\Scripts\Activate.ps1
python setup_atlas.py
python seed_database.py
python seed_maps.py
```

**4. Start the Frontend** (Terminal 2)
```powershell
cd suraksha\frontend
npm run dev
```

**5. Open the Application**

Navigate to [`http://localhost:5173`](http://localhost:5173) in your browser.

**6. Login with Demo Credentials**
- **Employee ID:** `EMP-INFOSEC-001`
- **Password:** `Demo@123`

**7. Test the Full Compliance Flow**

| Step | Action | Where |
|------|--------|-------|
| 1 | Login as CISO Admin | Login Page |
| 2 | Upload `rbi_circular_demo.txt` | Circulars → Upload |
| 3 | Run Gap Detection on the circular | Gap Detection |
| 4 | Review Suspected / Confirmed Gaps | Gap Dashboard |
| 5 | Approve a gap → creates a MAP task | Triage Queue |
| 6 | Log out, log in as `EMP-IT-001` | Login Page |
| 7 | Verify IT department sees the assigned task | Department Dashboard |

> 📄 A sample circular file is provided at the project root: **`rbi_circular_demo.txt`**

---

## 🔧 Common Errors & Fixes

### ❌ MongoDB Connection Refused / Timeout

**Symptom:** Backend logs show `ServerSelectionTimeoutError` or `Connection refused`.

**Fixes:**
- **Local MongoDB**: Ensure the MongoDB service is running.
  ```powershell
  # Check if mongod is running (Windows)
  Get-Process mongod
  # Start it if not running
  mongod --dbpath "C:\data\db"
  ```
- **Atlas**: Verify your `MONGODB_URI` in `backend/.env` is correct and your IP is whitelisted in the Atlas Network Access settings.

---

### ❌ CORS Policy Error (Frontend can't reach Backend)

**Symptom:** Browser console shows `Access-Control-Allow-Origin` errors.

**Fixes:**
- Ensure `BACKEND_CORS_ORIGINS` in `backend/.env` includes the exact frontend origin:
  ```env
  BACKEND_CORS_ORIGINS=["http://localhost:5173"]
  ```
- Ensure `VITE_API_URL` in `frontend/.env.development` matches the backend port:
  ```env
  VITE_API_URL=http://localhost:8000
  ```
- Restart the backend after any `.env` changes.

---

### ❌ Missing Python Packages / `ModuleNotFoundError`

**Symptom:** Backend crashes with `ModuleNotFoundError: No module named 'xyz'`.

**Fixes:**
```powershell
# Ensure the virtual environment is active (you should see (venv) in the prompt)
.\venv\Scripts\Activate.ps1

# Reinstall all dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### ❌ PowerShell Script Execution Policy Error

**Symptom:** `.\venv\Scripts\Activate.ps1 cannot be loaded because running scripts is disabled`.

**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\Activate.ps1
```

---

### ❌ npm Install Fails / Dependency Conflicts

**Symptom:** `npm install` exits with `ERESOLVE` or peer dependency errors.

**Fixes:**
```powershell
# Clear npm cache and retry
npm cache clean --force
npm install

# If still failing, use legacy peer deps flag
npm install --legacy-peer-deps
```

---

### ❌ Port Already in Use

**Symptom:** `OSError: [Errno 98] Address already in use` or Vite shows `port 5173 is in use`.

**Fixes:**
```powershell
# Find and kill the process using port 8000 (backend)
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# For frontend port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

---

### ❌ sentence-transformers Model Download Fails

**Symptom:** Gap detection fails on first run with a download or SSL error.

**Fixes:**
- Ensure you have a stable internet connection on first run.
- The model (`all-MiniLM-L6-v2`, ~120 MB) is cached after the first download. Subsequent runs are instant.
- If behind a corporate proxy, configure pip and HuggingFace proxy settings.

---

## 📋 Modules Explanation

### 1. Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Purpose**: Provides the user interface for all roles.
- **Key Pages**:
  - `AdminDashboard` — Global oversight for CISO and system admins, including triage management.
  - `DepartmentDashboard` — Tailored views for IT Lead, Legal Head, Operations Head, Risk Officer.
  - `Circulars` — The board where uploaded regulatory circulars are tracked and managed.
  - `GapDashboard` — Interface to trigger and review gap analysis results.
  - `TriageDashboard` — Sign-off and validation queue for potential compliance gaps.
  - `AuditPortalPage` — Golden thread audit trail for full regulatory traceability.

### 2. Backend (`/backend`)
- **Framework**: FastAPI (Python 3.10+) with Pydantic v2 for validation.
- **Database**: MongoDB Atlas / Local MongoDB with Motor (async driver).
- **Purpose**: Exposes RESTful APIs, handles database interactions, and runs core business logic.
- **Key Services**:
  - `auth` — Registration, login, JWT token generation and validation.
  - `circulars` — Document uploads, GridFS storage, ingestion triggers.
  - `gap_detector` — Semantic comparison engine using `sentence-transformers` vector embeddings.
  - `parsers` — Text extraction from PDFs, DOCX, and TXT files.
  - `maps` — Multi-Agent Path creation, department routing, and status tracking.

### 3. Mock Data & Seeding (`/mock-data`, seed scripts)
- Contains scripts and JSON fixtures to seed the database with mock policies, users, gaps, and MAP tasks for demo and testing purposes.

---

## 🐳 Docker Setup (Optional)

A `docker-compose.yml` is provided for containerised deployment:

```powershell
docker-compose up --build
```

This will spin up the backend, frontend, and a MongoDB container together. Refer to `DEPLOYMENT.md` for full cloud deployment instructions.

---

## 🔗 Additional Documentation

| Document | Description |
|----------|-------------|
| [`SETUP.md`](./SETUP.md) | Quick-start cheat sheet |
| [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) | End-to-end testing walkthrough with all credentials |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md) | Cloud deployment guide (Railway, Vercel, Atlas) |
| [`docs/backend_setup_guide.md`](./docs/backend_setup_guide.md) | Detailed backend setup reference |

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request.

Please follow the existing code style and ensure all seeded data reflects changes to user roles or schema.

---

## 📜 License

This project is built for demonstration and hackathon purposes. All rights reserved by the SuRaksha MAPS development team.

---

<div align="center">
  <strong>Built with ❤️ for safer financial compliance.</strong><br/>
  <sub>SuRaksha MAPS v4.0 — Automating compliance so humans can focus on decisions that matter.</sub>
</div>
