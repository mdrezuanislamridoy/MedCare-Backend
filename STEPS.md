# 🏥 MedCare Patient Portal – Backend Implementation Steps

This document outlines the step-by-step roadmap to implement all backend requirements for the MedCare Patient Portal (NestJS, Prisma, Microservices, and Gateway API).

---

## 📑 Table of Contents
1. [Phase 1: Database & Prisma Schema Enhancements](#phase-1-database--prisma-schema-enhancements)
2. [Phase 2: Microservices Layer Implementation](#phase-2-microservices-layer-implementation)
3. [Phase 3: Patient Gateway Controllers & DTOs](#phase-3-patient-gateway-controllers--dtos)
4. [Phase 4: Video Consultation & Third-Party Integrations](#phase-4-video-consultation--third-party-integrations)
5. [Phase 5: Security, Authorization & File Uploads](#phase-5-security-authorization--file-uploads)
6. [Phase 6: Verification & Testing Checklist](#phase-6-verification--testing-checklist)

---

## 🛠️ Phase 1: Database & Prisma Schema Enhancements ✅ (COMPLETED)

### Step 1.1: Expand `PatientProfile` Schema [x]
File: `prisma/schema/patient.prisma`
- Add health metrics and background fields:
  - `bloodGroup` (String?)
  - `height` (Float?)
  - `weight` (Float?)
  - `allergies` (String[] / String?)
  - `chronicConditions` (String[] / String?)
  - `emergencyName` (String?)
  - `emergencyRelationship` (String?)
  - `emergencyPhone` (String?)

### Step 1.2: Create `Prescription` Schema
File: `prisma/schema/prescription.prisma` (or inside `appointment.prisma`)
```prisma
model Prescription {
  id             String         @id @default(cuid())
  appointmentId  String         @unique
  appointment    Appointment    @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  patientId      String
  patient        PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctorId       String
  doctor         DoctorProfile  @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  diagnosis      String?
  advice         String?
  followUpDate   DateTime?
  medicines      Json           // Array of { name, dosage, timing, duration, instructions }
  pdfUrl         String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@map("prescriptions")
}
```

### Step 1.3: Create `MedicalRecord` Schema
File: `prisma/schema/medical_record.prisma`
```prisma
enum RecordCategory {
  LAB_REPORT
  PRESCRIPTION
  DISCHARGE_SUMMARY
  SCAN_XRAY
  OTHER
}

model MedicalRecord {
  id          String         @id @default(cuid())
  patientId   String
  patient     PatientProfile @relation(fields: [patientId], references: [id], onDelete: Cascade)
  title       String
  category    RecordCategory @default(LAB_REPORT)
  fileUrl     String
  fileType    String?        // 'pdf', 'image/jpeg', etc.
  fileSize    Int?           // In bytes
  recordDate  DateTime       @default(now())
  notes       String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("medical_records")
}
```

### Step 1.4: Run Migration & Generate Client
```bash
npx prisma migrate dev --name add_patient_portal_schemas
npx prisma generate
```

---

## ⚙️ Phase 2: Microservices Layer Implementation

Update/add business logic and message patterns in the respective microservices:

### Step 2.1: `PatientMicroservice`
File: `src/microservices/patient/`
- `PATIENT_GET_DASHBOARD_STATS`: Aggregates upcoming visits, completed visits, today's status, pending payments count.
- `PATIENT_GET_PROFILE`: Retrieves patient profile with full personal & medical history.
- `PATIENT_UPDATE_PROFILE`: Updates personal details, medical info, or emergency contacts.
- `PATIENT_LIST_MEDICAL_RECORDS`: Fetches all medical records filtered by category.
- `PATIENT_CREATE_MEDICAL_RECORD`: Stores uploaded document details.
- `PATIENT_DELETE_MEDICAL_RECORD`: Removes a medical record (with ownership check).

### Step 2.2: `AppointmentMicroservice`
File: `src/microservices/appointment/`
- `PATIENT_GET_APPOINTMENTS`: Lists patient's appointments filtered by status (`UPCOMING`, `COMPLETED`, `CANCELLED`).
- `PATIENT_BOOK_APPOINTMENT`: Validates doctor slot availability, locks slot, creates appointment record with `PENDING`/`CONFIRMED` status.
- `PATIENT_CANCEL_APPOINTMENT`: Cancels an appointment with reason and triggers refund status check.
- `PATIENT_RESCHEDULE_APPOINTMENT`: Changes date/time slot with validation.

### Step 2.3: `DoctorMicroservice`
File: `src/microservices/doctor/`
- `PATIENT_SEARCH_DOCTORS`: Searches doctors by query, specialty, clinic, price range, and rating.
- `PATIENT_GET_DOCTOR_SLOTS`: Calculates available time slots for a given doctor & date.

### Step 2.4: `FinanceMicroservice`
File: `src/microservices/finance/`
- `PATIENT_GET_BILLING_SUMMARY`: Calculates paid vs pending amounts.
- `PATIENT_LIST_INVOICES`: Lists all transactions and invoices for the patient.
- `PATIENT_INITIATE_PAYMENT`: Creates payment session for appointment booking or pending bill.

### Step 2.5: `ReviewMicroservice`
File: `src/microservices/review/`
- `PATIENT_LIST_PENDING_REVIEWS`: Finds completed appointments without a review.
- `PATIENT_SUBMIT_REVIEW`: Saves rating (1-5 stars) and feedback comment, recalculates doctor's average rating.

### Step 2.6: `NotificationMicroservice`
File: `src/microservices/notification/`
- `PATIENT_GET_NOTIFICATIONS`: Gets paginated notifications.
- `PATIENT_MARK_READ`: Marks individual or all notifications as read.

---

## 🚪 Phase 3: Patient Gateway Controllers & DTOs

Create the Patient Gateway Controller to expose REST endpoints to the frontend.

### Step 3.1: Create Gateway Controller
File: `src/gateway/patient.gateway.controller.ts`
- Routes to implement:
  - `GET    /api/patient/dashboard`
  - `GET    /api/patient/doctors`
  - `GET    /api/patient/doctors/:id/slots`
  - `GET    /api/patient/appointments`
  - `POST   /api/patient/appointments/book`
  - `POST   /api/patient/appointments/:id/cancel`
  - `POST   /api/patient/appointments/:id/reschedule`
  - `GET    /api/patient/prescriptions`
  - `GET    /api/patient/prescriptions/:id`
  - `GET    /api/patient/medical-records`
  - `POST   /api/patient/medical-records/upload`
  - `DELETE /api/patient/medical-records/:id`
  - `GET    /api/patient/payments/summary`
  - `GET    /api/patient/payments/invoices`
  - `POST   /api/patient/payments/checkout`
  - `GET    /api/patient/reviews/pending`
  - `POST   /api/patient/reviews`
  - `GET    /api/patient/notifications`
  - `PATCH  /api/patient/notifications/:id/read`
  - `PATCH  /api/patient/notifications/read-all`
  - `GET    /api/patient/profile`
  - `PUT    /api/patient/profile`
  - `POST   /api/patient/profile/change-password`

### Step 3.2: Register in Gateway Module
File: `src/gateway/gateway.module.ts`
- Add `PatientGatewayController` to the `controllers` array.

---

## 📹 Phase 4: Video Consultation & Third-Party Integrations

### Step 4.1: Video Call Token Generator
- Integrate WebRTC / Agora / Twilio / Daily.co for Telemedicine visits.
- Add endpoint: `GET /api/patient/appointments/:id/video-token` (Validates appointment is active & generates RTC Token).

### Step 4.2: Payment Gateway Webhook Handler
- Add webhook listener for SSLCommerz / Stripe / bKash to mark appointment payment status as `PAID`.

---

## 🛡️ Phase 5: Security, Authorization & File Uploads

### Step 5.1: Guards & Decorators
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles(Role.PATIENT)`
- Use `@CurrentUser()` decorator to extract authenticated patient's profile ID directly from JWT (prevention of IDOR).

### Step 5.2: File Upload Handling
- Configure `FileInterceptor` with disk storage / AWS S3 / Cloudinary for medical record PDFs and images.
- Enforce mime-type checks (`application/pdf`, `image/png`, `image/jpeg`) and max size limits (e.g. 10MB).

---

## 🧪 Phase 6: Verification & Testing Checklist

- [ ] Run unit tests for each microservice service class.
- [ ] Run e2e tests for `/api/patient/*` endpoints.
- [ ] Verify slot conflict prevention with concurrent booking tests.
- [ ] Test frontend integration by replacing mock data with API services.
