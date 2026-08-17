# 🩺 MedCare Doctor Portal – Backend Implementation Roadmap

This document outlines the step-by-step technical architecture and implementation roadmap for the **MedCare Doctor Portal** (`DOCTOR` role) in the NestJS microservices backend with Prisma 7, PostgreSQL, Redis, SSE, WebRTC/Agora video sessions, and Swagger OpenAPI.

---

## 📑 Table of Contents
1. [Portal Overview & Architecture](#-portal-overview--architecture)
2. [Phase 1: Database & Prisma Schema Enhancements](#-phase-1-database--prisma-schema-enhancements)
3. [Phase 2: Microservices Business Logic Layer](#-phase-2-microservices-business-logic-layer)
4. [Phase 3: Doctor Gateway REST API & DTOs](#-phase-3-doctor-gateway-rest-api--dtos)
5. [Phase 4: Real-Time Consultation Queue & Video Sessions](#-phase-4-real-time-consultation-queue--video-sessions)
6. [Phase 5: Security, RBAC & Medical EHR Compliance](#-phase-5-security-rbac--medical-ehr-compliance)
7. [Phase 6: Verification & Automated Testing Checklist](#-phase-6-verification--automated-testing-checklist)

---

## 🧭 Portal Overview & Architecture

The **Doctor Portal** serves as the clinical workspace for doctors, specialists, and surgeons to manage appointments, conduct teleconsultations, generate digital prescriptions, record clinical diagnoses, manage schedules, track earnings, and reply to patient feedback.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DOCTOR PORTAL                                 │
├──────────────┬────────────────┬────────────────┬───────────────────────┤
│ 1. Dashboard │ 2. Consultation│ 3. Digital     │ 4. Appointments       │
│    Summary   │    Workspace   │    Rx & Meds   │    & Telehealth Video │
├──────────────┼────────────────┼────────────────┼───────────────────────┤
│ 5. Patients  │ 6. Schedule &  │ 7. Financial   │ 8. Patient Reviews &  │
│    Directory │    Weekly Slots│    Earnings    │    Doctor Profile     │
└──────────────┴────────────────┴────────────────┴───────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Doctor Gateway Controller                           │
│                /doctor/* (RBAC: DOCTOR, ADMIN)                         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────┴─────────────────────────────────────┐
│                 Doctor, Appointment & Prescription Services            │
│  - Clinical EHR Recording  - Slot Generator  - Agora Video Token Gen   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────┴─────────────────────────────────────┐
│                 Prisma ORM & PostgreSQL Database                       │
│  doctor_profiles │ appointments │ prescriptions │ doctor_schedules     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Phase 1: Database & Prisma Schema Enhancements ✅ (COMPLETED)

### Step 1.1: Doctor Weekly Schedule & Availability Model
Create `prisma/schema/doctor-schedule.prisma`:
```prisma
model DoctorSchedule {
  id              String        @id @default(cuid())
  doctorId        String
  doctor          DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  dayOfWeek       String        // "Monday", "Tuesday", etc.
  isEnabled       Boolean       @default(true)
  startTime       String        @default("09:00") // "09:00"
  endTime         String        @default("17:00") // "17:00"
  breakStartTime  String?       // "13:00"
  breakEndTime    String?       // "14:00"
  slotDurationMin Int           @default(30)      // Consultation length in minutes

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([doctorId, dayOfWeek])
  @@map("doctor_schedules")
}
```

### Step 1.2: Consultation Clinical Notes Model
Create `prisma/schema/consultation-note.prisma`:
```prisma
model ConsultationNote {
  id            String         @id @default(cuid())
  appointmentId String         @unique
  appointment   Appointment    @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  doctorId      String
  doctor        DoctorProfile  @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  patientId     String
  patient       PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  symptoms      String?
  diagnosis     String
  clinicalNotes String?
  treatmentPlan String?
  vitals        Json?          // e.g. { bp: "120/80", pulse: 72, temp: 98.6, weight: 70 }
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([doctorId, patientId])
  @@map("consultation_notes")
}
```

### Step 1.3: Doctor Payout Request Model
Create `prisma/schema/doctor-payout.prisma`:
```prisma
enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  REJECTED
}

model DoctorPayout {
  id            String        @id @default(cuid())
  payoutNumber  String        @unique // e.g. "PAYOUT-5012"
  doctorId      String
  doctor        DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  amount        Float
  status        PayoutStatus  @default(PENDING)
  bankName      String?
  accountNumber String?
  notes         String?
  processedAt   DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([doctorId, status])
  @@map("doctor_payouts")
}
```

### Step 1.4: Expand `DoctorProfile`
File: `prisma/schema/doctor.prisma`
- Add fields:
  - `consultationFee Float @default(150)`
  - `experienceYears Int @default(5)`
  - `qualifications String[] @default([])`
  - `schedules DoctorSchedule[]`
  - `consultationNotes ConsultationNote[]`
  - `payouts DoctorPayout[]`

---

## ⚙️ Phase 2: Microservices Business Logic Layer

Create/expand methods in `DoctorService`, `AppointmentService`, `PrescriptionService`, and `FinanceService`:

### 1. Doctor Dashboard & Overview:
- `doctorGetDashboard(doctorId)`:
  - Today's stats (`todayAppointments`, `completedAppointments`, `pendingAppointments`, `todayEarnings`, `rating`, `totalPatients`).
  - Next upcoming appointment with video session status.
  - Active consultation queue.
  - Recent earnings summary.

### 2. Clinical Consultation Workspace:
- `doctorGetConsultationWorkspace(doctorId, appointmentId)`:
  - Patient history (vitals, blood group, allergies, past diagnoses, previous prescriptions, uploaded medical records).
- `doctorSaveConsultationNotes(doctorId, appointmentId, dto)`:
  - Record symptoms, diagnosis, treatment plan, and vitals.
- `doctorCompleteConsultation(doctorId, appointmentId)`:
  - Transition appointment to `COMPLETED`, update queue status to `COMPLETED`, credit doctor earnings.

### 3. Digital Prescriptions:
- `doctorCreatePrescription(doctorId, dto)`:
  - Medicine list with dosage, frequency, duration, instructions.
  - Advice & follow-up date.
  - Generates prescription record and triggers patient notification.
- `doctorListPrescriptions(doctorId, query)`:
  - Search by patient name or medicine; pagination.
- `doctorGetPrescriptionDetails(doctorId, prescriptionId)`:
  - Full prescription preview.

### 4. Appointments & Schedule Management:
- `doctorListAppointments(doctorId, query)`:
  - Filter by date, status, type (In-Person / Online Video).
- `doctorGetVideoSession(doctorId, appointmentId)`:
  - Generates WebRTC / Agora video room token for teleconsultation.
- `doctorUpdateSchedule(doctorId, dto)`:
  - Save weekly hours, break intervals, slot durations, and consultation fee.
- `doctorGetSchedule(doctorId)`:
  - Return doctor's active weekly roster and calendar day view.

### 5. Earnings & Payouts:
- `doctorGetEarningsSummary(doctorId)`:
  - Daily, weekly, monthly, and lifetime revenue.
  - Platform commission breakdown & pending payout balance.
  - Monthly earnings trend chart data.
- `doctorRequestPayout(doctorId, dto)`:
  - Create payout request (`PAYOUT-5012`) for admin finance approval.

### 6. Reviews & Patient Feedback:
- `doctorListReviews(doctorId, query)`:
  - Star rating distribution (5★ to 1★), percentage breakdown, recommendation rate.
- `doctorReplyReview(doctorId, reviewId, replyText)`:
  - Submit public thank you / feedback note to patient review.

---

## 🌐 Phase 3: Doctor Gateway REST API & DTOs

Create `src/gateway/doctor.gateway.controller.ts` with 18 REST endpoints under `/doctor/*`:

| # | HTTP Method | Route | Description | RBAC |
|---|---|---|---|---|
| **1** | `GET` | `/doctor/dashboard` | Doctor dashboard metrics, upcoming appointment & queue | `DOCTOR, ADMIN` |
| **2** | `GET` | `/doctor/consultations/:appointmentId` | Patient medical chart & workspace | `DOCTOR, ADMIN` |
| **3** | `POST` | `/doctor/consultations/:appointmentId/notes` | Save clinical examination notes & diagnosis | `DOCTOR, ADMIN` |
| **4** | `POST` | `/doctor/consultations/:appointmentId/complete` | Complete consultation & update queue status | `DOCTOR, ADMIN` |
| **5** | `POST` | `/doctor/prescriptions` | Create digital prescription with medicines & dosage | `DOCTOR, ADMIN` |
| **6** | `GET` | `/doctor/prescriptions` | List prescriptions issued by doctor | `DOCTOR, ADMIN` |
| **7** | `GET` | `/doctor/prescriptions/:id` | Get prescription details & print preview | `DOCTOR, ADMIN` |
| **8** | `GET` | `/doctor/appointments` | List doctor appointments with status/date filters | `DOCTOR, ADMIN` |
| **9** | `GET` | `/doctor/appointments/:id` | Get single appointment details | `DOCTOR, ADMIN` |
| **10**| `GET` | `/doctor/appointments/:id/video-session` | Get Agora / WebRTC room token for video consultation | `DOCTOR, ADMIN` |
| **11**| `GET` | `/doctor/patients` | List patients consulted by current doctor | `DOCTOR, ADMIN` |
| **12**| `GET` | `/doctor/patients/:id/medical-records` | View patient uploaded lab tests & documents | `DOCTOR, ADMIN` |
| **13**| `GET` | `/doctor/schedule` | Get doctor weekly schedule & slot duration | `DOCTOR, ADMIN` |
| **14**| `PUT` | `/doctor/schedule` | Update weekly working hours, breaks & fee | `DOCTOR, ADMIN` |
| **15**| `GET` | `/doctor/earnings` | Earnings analytics, commission & transaction list | `DOCTOR, ADMIN` |
| **16**| `POST` | `/doctor/earnings/payout-request` | Submit withdrawal / payout request | `DOCTOR, ADMIN` |
| **17**| `GET` | `/doctor/reviews` | List patient reviews & rating breakdown | `DOCTOR, ADMIN` |
| **18**| `POST` | `/doctor/reviews/:id/reply` | Reply to patient review feedback | `DOCTOR, ADMIN` |

---

## ⚡ Phase 4: Real-Time Consultation Queue & Video Sessions

- **Live Consultation Stream:**
  - Real-time SSE updates when receptionists check in patients or transition queue tokens (`CALLED`, `IN_ROOM`).
- **Teleconsultation Video Session:**
  - Integrated Agora / WebRTC room ID and token generator for HD telemedicine consultations.

---

## 🔒 Phase 5: Security, RBAC & Medical EHR Compliance

1. **Strict Doctor-Patient Authorization:**
   - A doctor can only view medical records and chart notes for patients who have an active or past appointment with them.
2. **Digital Prescription Signing:**
   - Auto-attaches doctor's license number, credentials, and digital signature timestamp.
3. **Financial Security:**
   - Payout requests validated against available balance before submission.

---

## 🧪 Phase 6: Verification & Automated Testing Checklist

- [ ] **Unit Tests for Doctor Business Logic (`doctor.service.spec.ts`):**
  - Test dashboard aggregation.
  - Test consultation completion & clinical note saving.
  - Test prescription creation with dosage validation.
  - Test schedule slot calculation and earnings summary.
- [ ] **Unit Tests for Doctor Gateway Controller (`doctor.gateway.controller.spec.ts`):**
  - Test HTTP endpoints, role guards, DTO validations.
- [ ] **Swagger OpenAPI Documentation:**
  - Annotate with `@ApiTags('Doctor Portal')`, `@ApiBearerAuth('JWT-auth')`.
- [ ] **Build & Integration Test:**
  - `npm test` passing 100%.
  - `npm run build` compiling with 0 errors.
