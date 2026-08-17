# MedCare Project - Global Overview & Progress

## 📌 Project Architecture
- **Frontend**: Next.js React Portal (`/Volumes/2BT/Ridoy/MedCare`)
  - Role-based modular portals (`patient`, `doctor`, `admin`, `super-admin`, `receptionist`, `clinic-manager`, `support-staff`)
- **Backend**: NestJS Microservices + Gateway (`/Volumes/2BT/Ridoy/MedCare Backend`)
  - Microservices: `patient`, `appointment`, `doctor`, `clinic`, `finance`, `review`, `notification`, `analytics`, `audit`, `rbac`, `system`
  - Database: PostgreSQL with Prisma ORM (multi-file schema in `prisma/schema/`)
- [x] **Receptionist / Front-Desk Portal Backend Roadmap:** Complete implementation details in [`RECEPTIONIST_BACKEND_STEPS.md`](file:///Volumes/2BT/Ridoy/MedCare%20Backend/RECEPTIONIST_BACKEND_STEPS.md).
- [x] **Support Staff Portal Backend Roadmap:** Complete architecture and implementation steps in [`SUPPORT_STAFF_BACKEND_STEPS.md`](file:///Volumes/2BT/Ridoy/MedCare%20Backend/SUPPORT_STAFF_BACKEND_STEPS.md).
- [ ] **Doctor Portal Backend Roadmap:** Complete architecture and implementation steps in [`DOCTOR_BACKEND_STEPS.md`](file:///Volumes/2BT/Ridoy/MedCare%20Backend/DOCTOR_BACKEND_STEPS.md).
  - [x] **Phase 1: Database & Prisma Schema Enhancements** (`doctor-schedule.prisma`, `consultation-note.prisma`, `doctor-payout.prisma`, `DoctorProfile` relations).
  - [ ] **Phase 2: Microservices Layer Implementation** (`DoctorService`, `PrescriptionService`, `AppointmentService` clinical notes & Agora video token methods).
  - [ ] **Phase 3: Doctor Gateway REST API & DTOs** (`DoctorGatewayController` with 18 endpoints under `/doctor/*`).
  - [ ] **Phase 4: Real-Time Consultation Queue & Video Sessions**.
  - [ ] **Phase 5: Security, RBAC & Medical EHR Compliance**.
  - [ ] **Phase 6: Verification & Automated Testing**.

---

## 🚀 Patient Portal Backend Implementation Roadmap

- [x] **Phase 1: Database & Prisma Schema Enhancements**
  - [x] Expanded `PatientProfile` with health metrics (`bloodGroup`, `height`, `weight`, `allergies`, `chronicConditions`, `emergencyName`, `emergencyRelationship`, `emergencyPhone`).
  - [x] Created `Prescription` schema (`prisma/schema/prescription.prisma`).
  - [x] Created `MedicalRecord` schema with `RecordCategory` enum (`prisma/schema/medical-record.prisma`).
  - [x] Linked relational references in `Appointment`, `DoctorProfile`, and `PatientProfile`.
  - [x] Validated Prisma schema (`npx prisma validate`) and generated client (`npx prisma generate`).
  - [x] Full build test passed successfully.

- [x] **Phase 2: Microservices Layer Implementation**
  - [x] `patient.service.ts`: Dashboard stats, full profile CRUD, medical records management, prescriptions.
  - [x] `appointment.service.ts`: Slot availability validation, booking, cancel, reschedule.
  - [x] `doctor.service.ts`: Patient doctor search & slot calculations.
  - [x] `finance.service.ts`: Patient billing summary & invoice generation.
  - [x] `review.service.ts`: Pending review query & review submission.
  - [x] `notification.service.ts`: Patient notifications fetch & mark as read.

- [x] **Phase 3: Patient Gateway Controllers & DTOs**
  - [x] Created `src/gateway/patient.gateway.controller.ts` with all `/api/patient/*` routes.
  - [x] Registered in `gateway.module.ts`.

- [x] **Phase 4: Video Consultation & Third-Party Integrations**
  - [x] Telemedicine RTC Video Token generator (`GET /patient/appointments/:id/video-session`).
  - [x] Payment gateway integration & webhook handler (`POST /patient/payments/checkout-session`, `POST /payments/webhook/:provider`).

- [x] **Phase 5: Security, Guards & File Uploads**
  - [x] `JwtAuthGuard` & `RolesGuard` for `Role.PATIENT` with IDOR ownership validation.
  - [x] Multer storage interceptor and file filters for medical report uploads (`POST /patient/medical-records/upload`).
  - [x] Static `/uploads` file serving & CORS configuration enabled in `main.ts`.

- [x] **Phase 6: Verification & Testing Checklist**
  - [x] Unit tests for `PatientService`, `AppointmentService`, `PatientGatewayController` created and passed (`15/15` tests passing).
  - [x] Slot collision prevention and video session generation tested.
  - [x] Full build test (`npm run build`) passed with 0 errors.

---

## 🏢 Receptionist Portal Backend Implementation Roadmap

- [x] **Phase 1: Database & Prisma Schema Enhancements**
  - [x] Created `PatientQueue` schema and `QueueStatus` enum (`prisma/schema/queue.prisma`).
  - [x] Added `roomNumber`, `isAvailableToday`, and `queues` relation to `DoctorProfile`.
  - [x] Linked relations in `Appointment`, `PatientProfile`, and `Clinic`.
  - [x] Validated Prisma schema and generated updated client (`./generated/prisma`).

- [x] **Phase 2: Microservices Layer Implementation**
  - [x] `appointment.service.ts`: Receptionist dashboard KPIs, 6-Step check-in engine, queue token generation, queue status transitions.
  - [x] `doctor.service.ts`: Hourly doctor schedule grid matrix (08:00 - 17:00), doctor room status & queue count.
  - [x] `patient.service.ts`: Fast receptionist patient search with visit history.
  - [x] `audit.service.ts`: Front-desk activity log retrieval.

- [x] **Phase 3: Receptionist Gateway Controllers & DTOs**
  - [x] Created `src/gateway/receptionist.gateway.controller.ts` with all 12 REST endpoints.
  - [x] Registered in `gateway.module.ts`.
  - [x] RBAC Guards (`RECEPTIONIST`, `CLINIC_MANAGER`, `ADMIN`, `SUPER_ADMIN`) applied.

- [x] **Phase 4: Real-time Live Queue & Notification Stream**
  - [x] Implemented `LiveQueueEventService` singleton event bus in `CommonModule`.
  - [x] Emitting live queue events (`CHECKED_IN`, `CALLED`, `IN_ROOM`, `COMPLETED`, `NO_SHOW`).
  - [x] Created SSE stream `GET /receptionist/queue/stream` with 15s heartbeat.
  - [x] Created waiting lobby TV display board endpoint `GET /receptionist/queue/display`.

- [x] **Phase 5: Security, RBAC & Front-Desk Audit Trail**
  - [x] `@Roles(UserRole.RECEPTIONIST, UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)` guards applied.
  - [x] Created `@Public()` decorator allowing TV lobby displays seamless access.
  - [x] Front-desk audit trail logging on check-in, queue transitions, and cancellations.

- [x] **Phase 6: Verification & Testing Checklist**
  - [x] Unit tests for `ReceptionistAppointmentService` (`receptionist.service.spec.ts`) created and passed.
  - [x] Unit tests for `ReceptionistGatewayController` (`receptionist.gateway.controller.spec.ts`) created and passed.
  - [x] Full test suite passed (`31/31` tests passing across 6 suites).
  - [x] Production build test (`npm run build`) passed with 0 errors.

---

## 📖 Swagger OpenAPI Documentation

- **Interactive API Docs URL:** `http://localhost:3000/api/docs`
- **Security Scheme:** `JWT Bearer Authentication` (`bearerFormat: 'JWT'`)
- **Tags & Modules Documented:**
  1. `Patient Portal` – Appointments, Prescriptions, Medical Records (with Multipart file upload), Video Consultations, Invoices, Reviews.
  2. `Receptionist Portal` – 6-Step Check-in Wizard, Live Token Queue, Doctor Schedule Matrix, Walk-In Bookings, Server-Sent Events (`/queue/stream`), and Lobby Display Screen (`/queue/display`).
  3. `Admin Analytics` – Platform & clinic metrics overview.
  4. `Admin Doctor Management` – Verification queue decisions & status.
  5. `Admin Patient Management` – Patient lookup & account status.
  6. `Admin Appointments` – Status transitions & rescheduling.
  7. `Admin Finance & Transactions` – Invoices & refund processing.
  8. `Admin Clinic Management` – Branch creation & configuration.
  9. `Admin Reviews & Ratings` – Moderation of patient reviews.
  10. `Admin Notifications` – Broadcast & targeted notifications.
  11. `Admin Audit Logs` – Security & operational audit trails.
  12. `Super Admin & RBAC` – Privilege requests & role-permission matrix.
  13. `Super Admin System & Health` – Health checks & database backup triggers.
  14. `Public Payments & Webhooks` – Stripe & SSLCommerz webhooks.

---

## 🐳 Docker & Containerization Setup

### 🛠️ 1. Local Development Mode (Database & Redis Only):
Runs only PostgreSQL, Redis, and pgAdmin in Docker, allowing you to develop and hot-reload the NestJS backend on your local machine.

```bash
# Start PostgreSQL, Redis & pgAdmin
npm run docker:dev
# or: docker compose -f docker-compose.dev.yml up -d

# Start NestJS backend with watch mode
npm run start:dev

# Stop dev containers
npm run docker:dev:down
```

### 🚀 2. Full-Stack Production Mode:
Runs the entire platform including the NestJS API container.

```bash
# Build and start all services
docker compose up -d --build

# View backend logs
docker compose logs -f medcare-api

# Stop all containers
docker compose down
```

### 📦 Services & Ports:
| Service | Container Name | Port | Purpose |
| :--- | :--- | :---: | :--- |
| **PostgreSQL** | `medcare-postgres-dev` | `localhost:5432` | Relational database (`medcare_db`) |
| **Redis** | `medcare-redis-dev` | `localhost:6379` | Cache & live queue pubsub |
| **pgAdmin** | `medcare-pgadmin-dev` | `http://localhost:5050` | Database web client (`admin@medcare.local` / `admin`) |
| **NestJS API** | `medcare-api` | `http://localhost:3000` | REST API Gateway & Swagger (`/api/docs`) |
