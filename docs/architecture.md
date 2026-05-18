# SuRaksha MAPS v4.0 — System Architecture

## Overview

SuRaksha MAPS is an agentic regulatory intelligence and compliance platform for Canara Bank. It ingests RBI/SEBI/CERT-In circulars, detects policy gaps via vector + keyword analysis, generates MAPs (Mitigation Action Plans), routes work to departments, validates evidence, and maintains a tamper-evident audit chain.

## Layers

| Layer | Stack | Responsibility |
|-------|--------|----------------|
| Frontend | React 18, Vite, Tailwind | Admin, Department, Audit portals |
| API | FastAPI | REST endpoints, JWT auth |
| Services | Python modules | Watcher, gap detector, MAP generator, routing, validator, audit logger |
| Data | MongoDB Atlas | Collections: users, circulars, policies, maps, evidence, gap_queue, audit_logs, tickets |

## Core Flow

1. **Watcher** — Upload PDF/DOCX/TXT → parse clauses → embed (384-dim) → `fully_parsed` / `partially_parsed` / `failed`
2. **Gap detector** — Only `fully_parsed` circulars; vector search + keyword compliance → gap queue
3. **MAP generator** — Provenance path, deadline, evidence checklist
4. **Routing** — `$graphLookup` department → lowest `active_maps_count` assignee → escalation chain
5. **Validator** — Type-specific evidence checks → pass / fail / manual_review
6. **Audit logger** — SHA-256 hash chain in `audit_logs`

## Portals

- `/admin/*` — Compliance officers, CISO
- `/dept/*` — Employees and department heads
- `/audit/*` — Read-only golden thread and logs
