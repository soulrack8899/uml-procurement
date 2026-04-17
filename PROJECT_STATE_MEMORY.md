# ProcuSure: AI Context Memory Block
**Last Updated:** April 17, 2026

## 1. Project Identity
- **Name:** ProcuSure
- **Core Mission:** High-precision procurement governance for Sarawak entities.
- **Design Philosophy:** "The Tectonic Ledger" — Editorial, asymmetrical, authoritative design utilizing deep blue/surface shifts instead of borders.

## 2. Technical Stack
- **Backend:** FastAPI (Python), SQLModel (SQLAlchemy + Pydantic), SQLite (Auth & Procurement DBs).
- **Frontend:** React, Framer Motion, Lucide Icons, Vanilla CSS (Thematic Tokens).
- **Key Patterns:** Self-healing DB startup, Multi-tenant infrastructure, Role-priority RBAC.

## 3. Current Architecture (Files)
- `/server`: `main.py` (orchestrations), `models.py` (dual-db logic), `scripts/` (diagnostics).
- `/src`: `App.jsx` (tenant context), `pages/` (Dashboard, ProcurementForm, UserManagement, AdminSettings, PettyCashDashboard).
- `/src/services`: `api.js` (centralized API client).

## 4. Operational Achievements (Implemented)
- **Multi-Tenancy:** Isolated company data environments.
- **Role System:** 5-tier RBAC (Global Admin -> Requester).
- **Workflow:** End-to-end procurement lifecycle (Submission to Payout).
- **Petty Cash:** Ledger with mandatory file evidence uploads.
- **Vendors:** Central directory with verification states.
- **Notifications:** In-app hub + SMTP Email alerts.
- **Auditing:** Immutable live audit feed for all transitions.

## 5. Ongoing / Persistent State
- **Database:** Auto-syncs missing columns on startup.
- **Settings:** Active financial thresholds (e.g., > RM 5,000 requiring Director approval).
- **Release Version:** v0.2.0-STABLE.

## 6. Development Instructions
- **The "No-Line" Rule:** Do not use borders; use background color shifts for sectioning.
- **Security:** Passwords must be hashed via SHA-256 before `passlib` processing.
- **CORS:** Ensure permissive headers for Railway/Vercel environments.
