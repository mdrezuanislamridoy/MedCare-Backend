# Clinic Manager Portal Backend Implementation Roadmap

## 📌 Overview
The Clinic Manager Portal provides end-to-end management for healthcare clinic branches, encompassing branch profiles, assigned doctors, clinical staff rosters, consultation and surgical rooms, doctor and room scheduling, live patient token queues, branch cash/digital revenue ledgers, performance analytics, and audit logging.

---

## 🚀 6-Phase Implementation Plan

### 1. Phase 1: Database & Prisma Schema Enhancements
- [x] Create `prisma/schema/clinic-room.prisma` (`ClinicRoom`, `RoomType`, `RoomStatus`).
- [x] Create `prisma/schema/clinic-staff.prisma` (`ClinicStaff`, `StaffRole`, `StaffShiftStatus`).
- [x] Update `prisma/schema/clinic.prisma` with relations (`rooms`, `staff`).
- [x] Run `npx prisma validate`, `npx prisma db push`, and `npx prisma generate`.

### 2. Phase 2: Microservices Layer Implementation
- [x] Create `src/microservices/clinic/dto/clinic-manager.dto.ts` with Swagger examples.
- [x] Expand `ClinicService` with comprehensive branch management methods (dashboard stats, doctor assignment, staff roster, room inventory, appointments, financials, reports, and activity logs).
- [x] Registered Live Clinic Event Subject & SSE stream.

### 3. Phase 3: Clinic Manager Gateway REST API
- [x] Create `src/gateway/clinic-manager.gateway.controller.ts` with 20 REST endpoints under `/clinic-manager/*`.
- [x] Protect with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(CLINIC_MANAGER, ADMIN, SUPER_ADMIN)`.
- [x] Register in `GatewayModule` and Swagger tag `'Clinic Manager Portal'` in `main.ts`.

### 4. Phase 4: Real-Time Live Room & Queue SSE Stream
- [x] Implement `GET /clinic-manager/stream` SSE with room occupancy, queue movements, and 15s heartbeat.

### 5. Phase 5: Security, RBAC & Multi-Branch Compliance
- [x] Enforced manager-clinic boundary authorization check (`resolveManagerClinic`).
- [x] Dual-log all branch administrative mutations to `AuditLog`.

### 6. Phase 6: Automated Testing & Verification
- [x] Create unit tests in `clinic-manager.service.spec.ts` & `clinic-manager.gateway.controller.spec.ts`.
- [x] Verify test suite (`npm test` -> 83/83 tests passing) and production build (`npm run build`).
- [x] Updated `GLOBAL_README.md`.
