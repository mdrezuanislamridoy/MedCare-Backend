# Clinic Manager Portal Backend Implementation Roadmap

## 📌 Overview
The Clinic Manager Portal provides end-to-end management for healthcare clinic branches, encompassing branch profiles, assigned doctors, clinical staff rosters, consultation and surgical rooms, doctor and room scheduling, live patient token queues, branch cash/digital revenue ledgers, performance analytics, and audit logging.

---

## 🚀 6-Phase Implementation Plan

### 1. Phase 1: Database & Prisma Schema Enhancements
- [ ] Create `prisma/schema/clinic-room.prisma` (`ClinicRoom`, `RoomType`, `RoomStatus`).
- [ ] Create `prisma/schema/clinic-staff.prisma` (`ClinicStaff`, `StaffRole`, `StaffShiftStatus`).
- [ ] Update `prisma/schema/clinic.prisma` with relations (`rooms`, `staff`, `financialLedger`).
- [ ] Run `npx prisma validate`, `npx prisma db push`, and `npx prisma generate`.

### 2. Phase 2: Microservices Layer Implementation
- [ ] Create `src/microservices/clinic/dto/clinic-manager.dto.ts` with Swagger examples.
- [ ] Expand `ClinicService` with comprehensive branch management methods.
- [ ] Update message patterns in `microservices.constants.ts` (`PATTERNS.CLINIC_MANAGER`).

### 3. Phase 3: Clinic Manager Gateway REST API
- [ ] Create `src/gateway/clinic-manager.gateway.controller.ts` with 16+ REST endpoints under `/clinic-manager/*`.
- [ ] Protect with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(CLINIC_MANAGER, ADMIN, SUPER_ADMIN)`.
- [ ] Register in `GatewayModule` and Swagger tag in `main.ts`.

### 4. Phase 4: Real-Time Live Room & Queue SSE Stream
- [ ] Implement `GET /clinic-manager/live-stream` SSE with room occupancy, queue movements, and 15s heartbeat.

### 5. Phase 5: Security, RBAC & Multi-Branch Compliance
- [ ] Enforce manager-clinic boundary authorization check.
- [ ] Dual-log all branch administrative mutations to `AuditLog`.

### 6. Phase 6: Automated Testing & Verification
- [ ] Create unit tests in `clinic-manager.service.spec.ts` & `clinic-manager.gateway.controller.spec.ts`.
- [ ] Verify test suite (`npm test`) and production build (`npm run build`).
- [ ] Update `GLOBAL_README.md`.
