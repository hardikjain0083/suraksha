<div align="center">

# 🛡️ SuRaksha MAPS v4.0

### Multi-Agent Policy System for Regulatory Compliance

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-suraksha--my--work.vercel.app-blue?style=for-the-badge)](https://suraksha-my-work.vercel.app)
[![Backend](https://img.shields.io/badge/🤗_Backend-Hugging_Face_Spaces-yellow?style=for-the-badge)](https://huggingface.co/spaces)
[![TypeScript](https://img.shields.io/badge/TypeScript-56.7%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-41.1%25-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

> **SuRaksha MAPS** automates the ingestion, gap detection, and compliance tracking of regulatory circulars (such as RBI guidelines) for financial institutions — powered by NLP, vector similarity, and a multi-agent workflow engine.

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🔄 Project Flow](#-project-flow)
- [📦 Modules](#-modules)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚙️ Local Setup](#️-local-setup)
- [🐳 Docker Deployment](#-docker-deployment)
- [☁️ Cloud Deployment](#️-cloud-deployment)
- [🔐 Environment Variables](#-environment-variables)
- [🧪 Testing](#-testing)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)

---

## 🌟 Overview

SuRaksha MAPS (Multi-Agent Policy System) is a full-stack compliance automation platform built for financial institutions dealing with the complex and ever-evolving landscape of regulatory requirements (such as RBI circulars in India).

The platform uses **NLP-powered gap detection**, **role-based access control (RBAC)**, and a **multi-agent task routing engine** to eliminate manual compliance work — making regulatory adherence faster, traceable, and auditable.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Zero-Trust RBAC** | Secure role-based login and department-specific dashboards |
| 📄 **Regulatory Ingestion** | Upload RBI or other regulatory circulars (PDF/TXT) for automatic parsing |
| 🧠 **AI Gap Detection** | NLP + vector similarity search to identify covered areas vs. compliance gaps |
| 🚦 **Triage Queue** | Human-in-the-loop validation — approve, dismiss, or escalate gaps |
| 🗺️ **MAP Creation** | Auto-creates Multi-Agent Paths routing tasks to the right team |
| 📊 **CISO Dashboard** | Global oversight for system admins and security officers |
| 🏢 **Dept. Dashboards** | Tailored views for IT, Legal, Risk, and other departments |
| 🐳 **Dockerized** | Fully containerized for portable, reproducible deployments |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                    │
│              React + TypeScript + Vite                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│   │  Admin       │  │  Department  │  │  Triage Queue    │ │
│   │  Dashboard   │  │  Dashboard   │  │  & Gap Review    │ │
│   └──────────────┘  └──────────────┘  └──────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────┐
│                 BACKEND (Hugging Face Spaces)                │
│              FastAPI (Python) + Pydantic                    │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  auth    │ │ circulars │ │  gap_    │ │   parsers    │  │
│  │ service  │ │  service  │ │ detector │ │   (PDF/TXT)  │  │
│  └──────────┘ └───────────┘ └──────────┘ └──────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    MongoDB Atlas                             │
│         Collections: users, circulars, gaps, maps           │
│                  GridFS for file storage                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Project Flow

The SuRaksha MAPS platform follows this end-to-end compliance workflow:

```
1. 🔑 Authentication
   └── User logs in → Zero-Trust RBAC → Department Dashboard

2. 📥 Regulatory Ingestion
   └── Compliance Officer uploads PDF/TXT circular
       └── System parses text, tables, and regulatory clauses

3. 🧠 Gap Detection
   └── Parsed clauses → Vector similarity search against internal policies
       └── Classify each clause:
           ├── ✅ Covered
           ├── ⚠️  Suspected Gap
           └── ❌ Confirmed Gap

4. 🚦 Triage & Validation
   └── Gaps sent to Triage Queue
       └── Authorized reviewer: Approve / Dismiss / Escalate

5. 🗺️ MAP Creation
   └── Approved gap → Multi-Agent Path (MAP)
       └── Task routed to relevant department (IT / Legal / Risk)
```

---

## 📦 Modules

### 1. 🖥️ Backend (`/backend`)

The core engine of SuRaksha MAPS — built with **FastAPI** and backed by **MongoDB Atlas**.

| Service | Purpose |
|---|---|
| `auth` | User registration, login, and JWT token generation |
| `circulars` | Document uploads, GridFS storage, and ingestion triggers |
| `gap_detector` | Compares new clauses against existing policies using vector search |
| `parsers` | Extracts text from PDFs and unstructured documents |

- **Framework:** FastAPI + Pydantic
- **Database:** MongoDB Atlas with GridFS for binary storage
- **Deployed on:** Hugging Face Spaces (Docker, port `7860`)

---

### 2. 🌐 Frontend (`/frontend`)

A clean, role-aware React UI for all compliance stakeholders.

| Component | Purpose |
|---|---|
| `AdminDashboard` | Global oversight for CISO and system admins |
| `DepartmentDashboard` | Tailored views for IT Lead, Legal Head, Risk Officer, etc. |
| `Circulars` | Board to track all uploaded and processed circulars |
| `GapDetection` | Interface to trigger and review gap analysis results |
| `Triage Queue` | Sign-off and validation workflow for identified gaps |

- **Framework:** React + TypeScript + Vite
- **Deployed on:** Vercel

---

### 3. 🗄️ Mock Data & Seeding (`/mock-data`)

Contains scripts and JSON fixtures to seed the database with mock policies, users, and gaps for local development and testing.

---

### 4. 📚 Docs (`/docs`)

Additional documentation covering architecture decisions, API references, and workflow diagrams.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | MongoDB Atlas, GridFS |
| **Auth** | JWT (JSON Web Tokens) |
| **AI/NLP** | Vector similarity search, NLP clause parsing |
| **Containerization** | Docker, Docker Compose |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Hugging Face Spaces (Docker SDK) |
| **CI Config** | `railway.toml`, `vercel.json` |

---

## ⚙️ Local Setup

### Prerequisites

- Node.js `≥18` and npm
- Python `≥3.10` and pip
- Docker & Docker Compose
- A MongoDB Atlas cluster (or local MongoDB instance)

### 1. Clone the Repository

```bash
git clone https://github.com/Pranavkale11/suraksha-my-work.git
cd suraksha-my-work
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your values in .env
```

See [🔐 Environment Variables](#-environment-variables) below for required keys.

### 3. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. (Optional) Seed Mock Data

```bash
cd mock-data
python seed.py
```

---

## 🐳 Docker Deployment

Spin up the full stack with Docker Compose in one command:

```bash
docker-compose up --build
```

This starts both the backend and any required services. The API will be available on port `7860` (Hugging Face compatible) or as configured.

---

## ☁️ Cloud Deployment

### Backend → Hugging Face Spaces

1. Create a new **Docker** Space on [hf.co/spaces](https://huggingface.co/spaces).
2. Copy the contents of `/backend` into the Space repository.
3. Rename `Dockerfile.hf` → `Dockerfile`.
4. Add Secrets in Space Settings (see environment variables below).
5. Push — Hugging Face auto-builds and deploys.

```bash
git clone https://huggingface.co/spaces/<your-username>/<your-space-name>
cp -r backend/* <your-space-name>/
mv <your-space-name>/Dockerfile.hf <your-space-name>/Dockerfile
cd <your-space-name> && git add . && git commit -m "Deploy backend" && git push
```

### Frontend → Vercel

1. Import the repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** (auto-detected).
4. Add environment variables.
5. Click **Deploy**.

### Post-Deployment

- Update `BACKEND_CORS_ORIGINS` on Hugging Face to your Vercel URL.
- Restart the Hugging Face Space to apply CORS changes.
- Test by registering a new user and uploading a circular.

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Strong random string for JWT signing | `supersecretkey123` |
| `ENVIRONMENT` | Runtime environment | `production` or `development` |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins | `["https://your-app.vercel.app"]` |
| `VITE_API_URL` | Backend API base URL (frontend) | `https://user-space.hf.space` |
| `VITE_DEMO_MODE` | Enable demo mode (frontend) | `true` |

Copy `.env.example` to `.env` and fill in all required values before running locally.

---

## 🧪 Testing

Refer to [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for the full testing strategy. In brief:

```bash
# Backend tests
cd backend
pytest

# Frontend type checking
cd frontend
npm run type-check

# Frontend linting
npm run lint
```

Mock data and seeding scripts in `/mock-data` can be used to populate the database with representative test scenarios.

---

## 📁 Project Structure

```
suraksha-my-work/
│
├── backend/                  # FastAPI Python backend
│   ├── auth/                 # Authentication service
│   ├── circulars/            # Circular upload & ingestion
│   ├── gap_detector/         # NLP gap detection engine
│   ├── parsers/              # PDF/TXT text extraction
│   └── Dockerfile.hf         # Hugging Face Docker config
│
├── frontend/                 # React + TypeScript + Vite UI
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Dashboard, Triage, Circulars, etc.
│   │   └── services/         # API client & data fetching
│   └── vite.config.ts
│
├── mock-data/                # Seed scripts & fixture JSON
├── docs/                     # Architecture & API docs
│
├── .env.example              # Environment variable template
├── docker-compose.yml        # Full-stack local dev setup
├── vercel.json               # Vercel deployment config
├── railway.toml              # Railway deployment config
├── DEPLOYMENT.md             # Step-by-step deployment guide
├── SETUP.md                  # Local setup guide
└── TESTING_GUIDE.md          # Testing documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<div align="center">

Made with ❤️ by [Pranav Kale](https://github.com/Pranavkale11)

⭐ Star this repo if you find it useful!

</div>
