# MedCare Project - Global Overview & Progress

## 📌 Project Architecture
- **Frontend**: Next.js React Portal (`/Volumes/2BT/Ridoy/MedCare`)
  - Role-based modular portals (`patient`, `doctor`, `admin`, `super-admin`, `receptionist`, `clinic-manager`, `support-staff`)
- **Backend**: NestJS Microservices + Gateway (`/Volumes/2BT/Ridoy/MedCare Backend`)
  - Microservices: `patient`, `appointment`, `doctor`, `clinic`, `finance`, `review`, `notification`, `analytics`, `audit`, `rbac`, `system`
  - Database: PostgreSQL with Prisma ORM (multi-file schema in `prisma/schema/`)

---

## 🚀 Patient Portal Backend Implementation Roadmap

- [x] **Phase 1: Database & Prisma Schema Enhancements**
  - [x] Expanded `PatientProfile` with health metrics (`bloodGroup`, `height`, `weight`, `allergies`, `chronicConditions`, `emergencyName`, `emergencyRelationship`, `emergencyPhone`).
  - [x] Created `Prescription` schema (`prisma/schema/prescription.prisma`).
  - [x] Created `MedicalRecord` schema with `RecordCategory` enum (`prisma/schema/medical-record.prisma`).
  - [x] Linked relational references in `Appointment`, `DoctorProfile`, and `PatientProfile`.
  - [x] Validated Prisma schema (`npx prisma validate`) and generated client (`npx prisma generate`).
  - [x] Full build test passed successfully.

- [ ] **Phase 2: Microservices Layer Implementation**
  - [ ] `patient.service.ts`: Dashboard stats, full profile CRUD, medical records management.
  - [ ] `appointment.service.ts`: Slot availability validation, booking, cancel, reschedule.
  - [ ] `doctor.service.ts`: Patient doctor search & slot calculations.
  - [ ] `finance.service.ts`: Patient billing summary & invoice generation.
  - [ ] `review.service.ts`: Pending review query & review submission.
  - [ ] `notification.service.ts`: Patient notifications fetch & mark as read.

- [ ] **Phase 3: Patient Gateway Controllers & DTOs**
  - [ ] Create `src/gateway/patient.gateway.controller.ts` with all `/api/patient/*` routes.
  - [ ] Register in `gateway.module.ts`.

- [ ] **Phase 4: Video Consultation & Third-Party Integrations**
  - [ ] Telemedicine RTC Token generator.
  - [ ] Payment gateway integration & webhook handler.

- [ ] **Phase 5: Security, Guards & File Uploads**
  - [ ] `JwtAuthGuard` & `RolesGuard` for `Role.PATIENT`.
  - [ ] Multer / Storage interceptor for medical report files.

- [ ] **Phase 6: Verification & Testing Checklist**
  - [ ] End-to-end integration and frontend data connection.
