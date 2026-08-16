# 🏢 MedCare Receptionist Portal – Backend Implementation Steps

This document outlines the step-by-step technical implementation roadmap for the MedCare Receptionist / Front-Desk Portal (NestJS, Prisma, Microservices, and Gateway API).

---

## 📑 Table of Contents
1. [Phase 1: Database & Prisma Schema Enhancements](#phase-1-database--prisma-schema-enhancements)
2. [Phase 2: Microservices Layer Implementation](#phase-2-microservices-layer-implementation)
3. [Phase 3: Receptionist Gateway Controllers & DTOs](#phase-3-receptionist-gateway-controllers--dtos)
4. [Phase 4: Real-time Live Queue & Notification Stream](#phase-4-real-time-live-queue--notification-stream)
5. [Phase 5: Security, RBAC & Front-Desk Audit Trail](#phase-5-security-rbac--front-desk-audit-trail)
6. [Phase 6: Verification & Testing Checklist](#phase-6-verification--testing-checklist)

---

## 🛠️ Phase 1: Database & Prisma Schema Enhancements ✅ (COMPLETED)

### Step 1.1: Create `PatientQueue` Schema & `QueueStatus` Enum
File: `prisma/schema/queue.prisma` (or within `appointment.prisma`)
```prisma
enum QueueStatus {
  WAITING
  CALLED
  IN_ROOM
  COMPLETED
  NO_SHOW
}

model PatientQueue {
  id            String       @id @default(cuid())
  queueNumber   Int          // Sequential token number per doctor/clinic per day (e.g. 1, 2, 3...)
  appointmentId String       @unique
  appointment   Appointment  @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  doctorId      String
  doctor        DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patientId     String
  patient       PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  clinicId      String?
  clinic        Clinic?      @relation(fields: [clinicId], references: [id])
  roomNumber    String?      // e.g. "Room 101"
  status        QueueStatus  @default(WAITING)
  checkInTime   DateTime     @default(now())
  calledAt      DateTime?
  inRoomAt      DateTime?
  completedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([clinicId, doctorId, status])
  @@index([createdAt])
  @@map("patient_queues")
}
```

### Step 1.2: Expand `DoctorProfile` with Room Assignment & Presence
File: `prisma/schema/doctor.prisma`
- Add room and attendance fields:
  - `roomNumber` (String?)
  - `isAvailableToday` (Boolean @default(true))
  - `queues` (PatientQueue[])

### Step 1.3: Link Relations in `Appointment` and `Clinic`
- Link `queue PatientQueue?` in `Appointment` model.
- Link `queues PatientQueue[]` in `Clinic` model.

### Step 1.4: Run Migration & Generate Client
```bash
npx prisma migrate dev --name add_receptionist_queue_schema
npx prisma generate
```

---

## ⚙️ Phase 2: Microservices Layer Implementation ✅ (COMPLETED)

Update business logic in the microservices layer to handle reception desk operations:

### Step 2.1: `AppointmentMicroservice` (Check-In & Queue Processor)
File: `src/microservices/appointment/`
- `RECEPTIONIST_GET_DASHBOARD_STATS`:
  - Aggregates today's appointments count, waiting count in lobby, checked-in count, completed count, cancelled/no-show count, and available doctor count.
- `RECEPTIONIST_EXECUTE_CHECK_IN`:
  - Validates appointment status (`CONFIRMED`).
  - Auto-calculates next incremental daily queue token for doctor.
  - Updates appointment status to `CHECKED_IN`.
  - Creates `PatientQueue` record with room number and `WAITING` status.
  - Logs front-desk audit action.
- `RECEPTIONIST_GET_LIVE_QUEUE`:
  - Fetches active queue entries for the clinic/doctor (ordered by token number).
- `RECEPTIONIST_UPDATE_QUEUE_STATUS`:
  - State machine transitions: `WAITING` -> `CALLED` -> `IN_ROOM` -> `COMPLETED` / `NO_SHOW`.
  - Updates timestamps (`calledAt`, `inRoomAt`, `completedAt`).
- `RECEPTIONIST_WALK_IN_BOOKING`:
  - Creates instant walk-in appointment and directly queues the patient.

### Step 2.2: `DoctorMicroservice` (Schedule Grid Matrix & Room Management)
File: `src/microservices/doctor/`
- `RECEPTIONIST_GET_SCHEDULE_GRID`:
  - Retrieves all clinic doctors' hourly schedules (08:00 to 17:00) with booked appointment cards and open slots.
- `RECEPTIONIST_GET_DOCTOR_STATUS_LIST`:
  - Returns doctor availability, assigned chamber rooms, active queue lengths, and next scheduled visit.

### Step 2.3: `PatientMicroservice` (Directory & Lookup)
File: `src/microservices/patient/`
- `RECEPTIONIST_SEARCH_PATIENTS`:
  - Fast search by Name, Phone number, or Patient ID with visit counts and history.

### Step 2.4: `AuditMicroservice` (Front-Desk Activity Log)
File: `src/microservices/audit/`
- `RECEPTIONIST_GET_ACTIVITY_LOG`:
  - Queries recent front-desk actions (Check-ins, Queue transitions, Reschedules, Cancellations).

---

## 🚪 Phase 3: Receptionist Gateway Controllers & DTOs ✅ (COMPLETED)

Expose clean, secure REST endpoints under the `/receptionist` route prefix.

### Step 3.1: Create Gateway Controller
File: `src/gateway/receptionist.gateway.controller.ts`
- Routes to implement:
  - `GET    /receptionist/dashboard` – Real-time stats & timeline.
  - `GET    /receptionist/appointments` – Filtered list (All, Confirmed, Checked In, In Progress, Completed, Cancelled, No Show).
  - `POST   /receptionist/check-in` – 6-Step check-in execution (Appointment verification, token generation, room assignment).
  - `GET    /receptionist/queue` – Live queue table with waiting times.
  - `PATCH  /receptionist/queue/:id/status` – Transition queue status (`CALLED`, `IN_ROOM`, `COMPLETED`, `NO_SHOW`).
  - `GET    /receptionist/doctors` – Doctor room list, attendance & active queue lengths.
  - `GET    /receptionist/schedule` – Hourly grid schedule across all doctors.
  - `POST   /receptionist/schedule/walk-in` – Instant walk-in appointment creation.
  - `GET    /receptionist/patients` – Patient directory with visit history.
  - `GET    /receptionist/activity` – Front-desk timestamped audit trail.

### Step 3.2: Register in Gateway Module
File: `src/gateway/gateway.module.ts`
- Add `ReceptionistGatewayController` to `controllers`.

---

## 📢 Phase 4: Real-time Live Queue & Notification Stream ✅ (COMPLETED)

### Step 4.1: Live Queue WebSocket / SSE Gateway
File: `src/gateway/queue.gateway.ts`
- Broadcast queue events (`queue:patient_called`, `queue:patient_checked_in`, `queue:patient_in_room`) to waiting room displays and doctor dashboards.

---

## 🛡️ Phase 5: Security, RBAC & Front-Desk Audit Trail ✅ (COMPLETED)

### Step 5.1: Guards & Roles
- Apply `@UseGuards(JwtAuthGuard, RolesGuard)`
- Apply `@Roles(UserRole.RECEPTIONIST, UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)`
- Bind actor information to all status changes.

### Step 5.2: Audit Trail Logging
- Log every check-in, queue call, cancellation, and reschedule with receptionist user ID and timestamp.

---

## 🧪 Phase 6: Verification & Testing Checklist

- [ ] Run unit tests for `PatientQueue` state machine transitions.
- [ ] Test incremental token assignment logic (ensuring daily reset and doctor separation).
- [ ] Test check-in execution with double check-in prevention.
- [ ] Test schedule matrix slot conflict validation.
- [ ] Validate NestJS backend build (`npm run build`).
