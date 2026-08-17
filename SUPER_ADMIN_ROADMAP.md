# 👑 Super Admin Portal Backend & Frontend Integration Roadmap

This document outlines the complete architectural overview, needed API surface, work list, and implementation phases for the **Super Admin Portal** in MedCare.

---

## 🎯 Super Admin Feature Scope & Capabilities

The Super Admin is the highest authority across the entire MedCare multi-tenant healthcare platform, possessing 16 operational domains:

1. **Dashboard & Platform KPIs:** Real-time metrics across all 7 roles, active clinics, total revenue, verification queues, and instant action triggers.
2. **Platform Analytics:** Revenue stream projections, weekly consultation volumes, patient/doctor acquisition velocity, and branch performance rankings.
3. **Administrator Management:** Full lifecycle control over platform admins and branch managers (create, promote, revoke, suspend).
4. **Doctor Registry & Credentialing:** Verification approvals (`APPROVED`, `DOCS_REQUESTED`, `REJECTED`), license authentication, fee controls, and account status (`ACTIVE`, `SUSPENDED`).
5. **Patient Registry:** Unified patient records oversight, fraud prevention, and account moderation.
6. **Clinic & Branch Network:** Multi-branch provisioning, clinic manager assignment, room capacity, and revenue sharing configurations.
7. **RBAC & Permission Matrix:** Fine-grained resource permission matrix across all 7 platform roles.
8. **Credential Verification Queue:** License review workflow for medical practitioners.
9. **Global Appointment Oversight:** System-wide appointment monitoring, emergency cancellations, and dispute interventions.
10. **Finance & Payouts Ledger:** Platform commissions, transaction reconciliation, doctor withdrawal approvals, and refund processing.
11. **Reviews & Rating Moderation:** Anti-abuse filtering, toxic comment removal, and clinical feedback scorecards.
12. **System Notifications & Emergency Broadcasts:** Mass email, SMS, and in-app emergency alert dispatches.
13. **Immutable Audit Logs:** Non-repudiable audit trails tracking actor IDs, IPs, action types, timestamps, and resource mutations.
14. **Security & Access Monitoring:** 2FA enforcement, failed login rate limiting, IP blacklisting, and session revocation.
15. **System & Server Health:** Microservice heartbeat, CPU/memory telemetry, Redis cache latency, PostgreSQL connection pool metrics.
16. **Global Platform Settings:** Commission rate (%), maintenance mode toggling, currency configuration, and gateway integrations.

---

## 🔌 Complete API Surface for Super Admin

### 1. Analytics & Overview (`/admin/analytics/*` & `/super-admin/analytics/*`)
- `GET /admin/analytics/overview` — High-level platform KPIs (total patients, doctors, revenue, active queue).
- `GET /admin/analytics/appointments` — Weekly/monthly appointment distribution and cancellation metrics.
- `GET /admin/analytics/revenue` — Platform revenue vs doctor payouts vs commission breakdown.
- `GET /admin/analytics/performance` — Clinic branch and specialist ranking analytics.

### 2. Administrators & RBAC (`/super-admin/rbac/*` & `/super-admin/administrators/*`)
- `GET /super-admin/administrators` — List all platform administrators and clinic managers.
- `POST /super-admin/administrators` — Provision new administrator with role and clinic assignment.
- `PATCH /super-admin/administrators/:id/status` — Suspend, activate, or modify admin permissions.
- `GET /super-admin/rbac/matrix` — Full 7-role permission matrix.
- `POST /super-admin/rbac/roles` — Create custom role.
- `PUT /super-admin/rbac/roles/:id/permissions` — Update permissions assigned to a role.
- `GET /super-admin/rbac/access-requests` — List elevated privilege access requests.
- `POST /super-admin/rbac/access-requests/:id/decision` — Approve or reject elevated privilege request.

### 3. Doctor Verification & Management (`/admin/doctors/*`)
- `GET /admin/doctors` — List all registered doctors with filters.
- `GET /admin/doctors/pending-verification` — Doctor credential verification queue.
- `POST /admin/doctors/:id/verify` — Approve, request additional documents, or reject doctor credentials.
- `PUT /admin/doctors/:id/status` — Activate or suspend doctor account.

### 4. Patient Directory (`/admin/patients/*`)
- `GET /admin/patients` — List all patients across all clinics.
- `GET /admin/patients/:id` — Patient profile details and history.
- `PUT /admin/patients/:id/status` — Moderate patient account status (`ACTIVE`, `SUSPENDED`).

### 5. Multi-Branch Clinics (`/admin/clinics/*`)
- `GET /admin/clinics` — List all clinic branches.
- `POST /admin/clinics` — Provision new clinic branch.
- `GET /admin/clinics/:id` — Branch details, assigned doctors, and rooms.
- `PUT /admin/clinics/:id` — Update clinic profile and manager assignment.
- `GET /admin/clinics/:id/performance` — Clinic branch revenue and patient throughput.

### 6. Appointments & Teleconsultations (`/admin/appointments/*`)
- `GET /admin/appointments` — Platform-wide appointment list with status filters.
- `GET /admin/appointments/:id` — Full appointment inspection.
- `PUT /admin/appointments/:id/status` — Super admin appointment status override.

### 7. Financials & Payouts (`/admin/finance/*`)
- `GET /admin/finance/summary` — Total volume, escrow balance, payouts, and revenue.
- `GET /admin/finance/transactions` — Platform transactions ledger.
- `GET /admin/finance/payouts` — Doctor payout requests list.
- `POST /admin/finance/payouts/:id/action` — Approve, disburse, or decline withdrawal request.

### 8. Reviews Moderation (`/admin/reviews/*`)
- `GET /admin/reviews` — All patient reviews and complaints.
- `POST /admin/reviews/:id/moderate` — Hide, approve, or delete review.

### 9. Notifications & Broadcasts (`/admin/notifications/*`)
- `GET /admin/notifications` — Notification dispatches log.
- `POST /admin/notifications/broadcast` — Send system-wide broadcast to specific roles or all users.

### 10. Audit Logs (`/admin/audit-logs/*`)
- `GET /admin/audit-logs` — Immutable audit log feed with actor search and action filters.
- `GET /admin/audit-logs/export` — Export audit logs for compliance.

### 11. System Health, Telemetry & Global Settings (`/super-admin/system/*`)
- `GET /super-admin/system/health` — Database connection pool, Redis latency, memory/CPU telemetry.
- `GET /super-admin/system/settings` — Platform commission, maintenance mode, currency.
- `PUT /super-admin/system/settings` — Update global configurations.
- `POST /super-admin/system/backup` — Trigger manual backup snapshot.
- `GET /super-admin/system/stream` — Real-time Server-Sent Events (SSE) telemetry stream.

---

## 📋 Implementation Phases & Work List

- [x] **Phase 1: Backend Administrators & RBAC Expansion**
  - [x] Added `GET /super-admin/administrators`, `POST /super-admin/administrators`, `PATCH /super-admin/administrators/:id/status` to `SuperAdminRbacGatewayController` and `RbacService`.
  - [x] Added `GET /super-admin/system/stream` SSE stream in `SuperAdminSystemGatewayController`.

- [x] **Phase 2: Frontend Super Admin API Client (`super-admin.api.ts`)**
  - [x] Created centralized TypeScript client with connectors for all 16 Super Admin operational domains.

- [x] **Phase 3: Connect Super Admin Frontend Views in `App.tsx`**
  - [x] Connected live analytics, administrators, doctors verification queue, clinics, RBAC matrix, appointments, financials, audit logs, and system health.
  - [x] Built full dedicated interactive views for Reviews Moderation, Broadcast Notifications, and Platform Settings.

- [x] **Phase 4: Verification & Automated Testing**
  - [x] Ran backend unit tests (`npm test`: 83/83 passed).
  - [x] Ran frontend production build (`npm run build`: 13/13 routes compiled).
  - [x] Updated `GLOBAL_README.md`.
