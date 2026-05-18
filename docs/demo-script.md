# Judge Demo Script

## Login

| Role | ID | Password |
|------|-----|----------|
| CISO | EMP-INFOSEC-001 | Demo@123 |
| Dept employee | EMP-INFOSEC-003 | Demo@123 |

## Flow

1. **Admin** — Upload circular at `/admin/circulars/upload` (use `mock-data/circulars/rbi_circular_demo.txt`)
2. **Gaps** — Run detection on `fully_parsed` circular at `/admin/gaps`
3. **Triage** — `/admin/triage` approve gaps → generate MAPs
4. **Route** — `POST /api/maps/MAP-2026-013/route` → assignee `EMP-INFOSEC-003`
5. **Department** — Login as EMP-INFOSEC-003 → `/dept/maps` Kanban
6. **Audit** — `/audit/logs` → Verify chain integrity
7. **Duplicate** — Re-upload same file → `"status": "duplicate"`

## Seed

```bash
cd backend
python seed_users_only.py
python seed_maps.py
```
