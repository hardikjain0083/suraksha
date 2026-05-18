# Deployment Guide

## Local (Docker Compose)

```bash
docker compose up --build
```

API: `http://localhost:8000`  
MongoDB: `mongodb://localhost:27017/suraksha_maps`

## Local (manual)

```bash
cd backend
pip install -r requirements.txt
python setup_atlas.py
python seed_users_only.py
python seed_maps.py
uvicorn main:app --reload
```

```bash
cd frontend
npm install
npm run dev
```

## Environment

Copy `.env.example` to `backend/.env`. Set `MONGODB_URI` and `JWT_SECRET`. Use `DEMO_MODE=true` only for judge demos.

## Production

- Frontend: Vercel (`frontend/` root)
- Backend: Railway/Render (`backend/` root)
- Database: MongoDB Atlas M10+ for vector search indexes
