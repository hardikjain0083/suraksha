# API Reference (Summary)

Base URL: `http://localhost:8000`

## Health

- `GET /health` — API and database status

## Circulars

- `POST /api/circulars/upload` — Upload; duplicate returns `{ "status": "duplicate" }`
- `GET /api/circulars` — List circulars

## Gaps

- `POST /api/gaps/detect/{circular_id}` — Run gap detection (`fully_parsed` only)
- `GET /api/gaps/queue` — Triage queue

## MAPs

- `POST /api/maps/generate` — Create MAP from gap
- `POST /api/maps/{map_id}/route` — Route to department + assignee
- `GET /api/maps/triage/dashboard` — Admin triage

## Department

- `GET /api/dept/maps` — Assigned MAPs (JWT)
- `POST /api/dept/maps/{map_id}/upload-evidence`

## Evidence

- `POST /api/evidence/{evidence_id}/validate`
- `POST /api/validation/validate/{evidence_id}`

## Audit

- `POST /api/audit/log`
- `GET /api/audit/logs`
- `POST /api/audit/verify-chain` — Returns `{ "integrity": "valid" | "broken" }`
