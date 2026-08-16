# 🎧 MedCare Support Staff Portal – Backend Implementation Roadmap

This document outlines the step-by-step technical architecture and implementation roadmap for the **MedCare Support Staff Portal** (`SUPPORT_STAFF` role) in the NestJS microservices backend with Prisma 7, PostgreSQL, Redis, SSE, and Swagger OpenAPI.

---

## 📑 Table of Contents
1. [Portal Overview & Architecture](#-portal-overview--architecture)
2. [Phase 1: Database & Prisma Schema Design](#-phase-1-database--prisma-schema-design)
3. [Phase 2: Microservices Business Logic Layer](#-phase-2-microservices-business-logic-layer)
4. [Phase 3: Support Staff Gateway REST API & DTOs](#-phase-3-support-staff-gateway-rest-api--dtos)
5. [Phase 4: Real-Time Communication & Live Ticket Stream](#-phase-4-real-time-communication--live-ticket-stream)
6. [Phase 5: Security, Privacy & HIPAA/GDPR Compliance](#-phase-5-security-privacy--hipaagdpr-compliance)
7. [Phase 6: Verification & Automated Testing Checklist](#-phase-6-verification--automated-testing-checklist)

---

## 🧭 Portal Overview & Architecture

The **Support Staff Portal** empowers customer care, technical assistance, and helpdesk teams to resolve patient issues efficiently while enforcing strict data privacy standards (preventing exposure of confidential EHR/medical charts).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPPORT STAFF PORTAL                            │
├──────────────┬────────────────┬────────────────┬───────────────────────┤
│ 1. Dashboard │ 2. Tickets     │ 3. Complaints  │ 4. Patient Support    │
│    Overview  │    Helpdesk    │    Escalation  │    (Privacy-Filtered) │
├──────────────┼────────────────┼────────────────┼───────────────────────┤
│ 5. Appt Help │ 6. Chat Msg    │ 7. Alerts &    │ 8. Staff Activity &   │
│    Reschedule│    Internal    │    Notifs      │    Audit Trail        │
└──────────────┴────────────────┴────────────────┴───────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Support Staff Gateway Controller                       │
│             /support-staff/* (RBAC: SUPPORT_STAFF, ADMIN)              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────┴─────────────────────────────────────┐
│                 Support Microservice & Event Bus                       │
│  - Ticket State Machine   - Complaint Escalation   - Live SSE Stream   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────┴─────────────────────────────────────┐
│                 Prisma ORM & PostgreSQL Database                       │
│  support_tickets │ ticket_messages │ complaints │ support_activities   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Phase 1: Database & Prisma Schema Design ✅ (COMPLETED)

### Step 1.1: Support Ticket & Thread Messages Model
Create `prisma/schema/support-ticket.prisma`:
```prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_FOR_USER
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketCategory {
  APPOINTMENT
  PAYMENT
  ACCOUNT
  DOCTOR
  TECHNICAL
  GENERAL
}

model SupportTicket {
  id              String          @id @default(cuid())
  ticketNumber    String          @unique // e.g. "TICK-8021"
  patientId       String
  patient         PatientProfile  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  assignedStaffId String?
  assignedStaff   User?           @relation(fields: [assignedStaffId], references: [id])
  subject         String
  description     String
  category        TicketCategory  @default(GENERAL)
  priority        TicketPriority  @default(MEDIUM)
  status          TicketStatus    @default(OPEN)
  
  messages        TicketMessage[]
  
  resolvedAt      DateTime?
  closedAt        DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([status, priority])
  @@index([assignedStaffId])
  @@index([patientId])
  @@map("support_tickets")
}

model TicketMessage {
  id              String          @id @default(cuid())
  ticketId        String
  ticket          SupportTicket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  senderId        String
  sender          User            @relation(fields: [senderId], references: [id])
  senderName      String
  senderRole      UserRole
  message         String
  isInternalNote  Boolean         @default(false)
  attachments     String[]        @default([])
  createdAt       DateTime        @default(now())

  @@index([ticketId, createdAt])
  @@map("ticket_messages")
}
```

### Step 1.2: Patient Complaints & Dispute Escalation Model
Create `prisma/schema/complaint.prisma`:
```prisma
enum ComplaintStatus {
  NEW
  UNDER_INVESTIGATION
  RESPONDED
  RESOLVED
  ESCALATED
}

enum ComplaintCategory {
  DOCTOR_CONDUCT
  BILLING_ERROR
  APPOINTMENT_ERROR
  STAFF_CONDUCT
  WAIT_TIME
  OTHER
}

model Complaint {
  id                String            @id @default(cuid())
  complaintNumber   String            @unique // e.g. "CMP-4019"
  patientId         String
  patient           PatientProfile    @relation(fields: [patientId], references: [id], onDelete: Cascade)
  relatedDoctorId   String?
  relatedDoctor     DoctorProfile?    @relation(fields: [relatedDoctorId], references: [id])
  category          ComplaintCategory @default(OTHER)
  priority          TicketPriority    @default(MEDIUM)
  status            ComplaintStatus   @default(NEW)
  title             String
  description       String
  adminNotes        String?
  resolutionSummary String?
  assignedStaffId   String?
  assignedStaff     User?             @relation(fields: [assignedStaffId], references: [id])
  
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([status, priority])
  @@index([relatedDoctorId])
  @@map("complaints")
}
```

### Step 1.3: Support Staff Activity Log Model
Create `prisma/schema/support-activity.prisma`:
```prisma
model SupportActivity {
  id          String   @id @default(cuid())
  staffId     String
  staff       User     @relation(fields: [staffId], references: [id], onDelete: Cascade)
  staffName   String
  action      String   // e.g. "RESOLVED_TICKET", "ESCALATED_COMPLAINT", "RESCHEDULED_APPT"
  targetId    String?  // Ticket ID, Complaint ID, or Appointment ID
  details     String?
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([staffId, createdAt])
  @@map("support_activities")
}
```

---

## ⚙️ Phase 2: Microservices Business Logic Layer ✅ (COMPLETED)

Create `src/microservices/support/support.service.ts` with the following core business domain methods:

### 1. Dashboard & Performance Metrics:
- `getDashboardStats()`: Counts for Open, In Progress, Resolved Today, Urgent Issues, Flagged Appointments, and Unread Inquiries.
- `getResolutionKpis()`: Avg resolution time, First contact resolution (FCR) rate, Customer satisfaction score (CSAT), Escalation rate.

### 2. Support Ticket Workflows:
- `listTickets(filters)`: Search by patient name, subject, ticket number; filter by status, priority, category; pagination.
- `getTicketDetails(ticketId)`: Fetch full ticket metadata and chronological thread messages.
- `createTicket(staffId, dto)`: Open a ticket on behalf of a patient (phone call / email walk-in).
- `assignTicket(ticketId, staffId)`: Assign or reassign ticket ownership.
- `replyTicket(ticketId, staffId, dto)`: Add public reply to patient or internal private note.
- `updateTicketStatus(ticketId, status, staffId)`: Transition ticket (`IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`).

### 3. Patient Complaints & Escalation:
- `listComplaints(filters)`: Filter by `NEW`, `UNDER_INVESTIGATION`, `RESPONDED`, `RESOLVED`, `ESCALATED`.
- `getComplaintDetails(complaintId)`: Full details including related doctor and incident notes.
- `updateComplaintStatus(complaintId, action, notes, staffId)`: Update state (Investigate, Respond, Resolve, Escalate to Admin).
- `escalateToAdmin(complaintId, reason, staffId)`: Send high-priority alert to clinic managers / super admins.

### 4. Privacy-Preserving Patient Lookup:
- `searchPatients(query)`: Search by Name, Email, Phone, Patient ID. Returns only account metadata, contact details, emergency phone, and verification status. *(Prescriptions, EHR lab documents, and billing history are masked/hidden for privacy)*.
- `resendPatientNotification(patientId, type)`: Trigger resend of verification email, appointment SMS, or password reset link.

### 5. Appointment Issue Assistance:
- `listFlaggedAppointments()`: Fetch appointments flagged with patient issues (late doctor, room change, reschedule request).
- `assistRescheduleAppointment(appointmentId, dto, staffId)`: Reschedule on behalf of patient with automated audit entry.
- `clearAppointmentFlag(appointmentId, staffId)`: Mark appointment issue resolved.

### 6. Staff Internal Messages & Notifications:
- `listSupportChannels()`: Direct staff messaging & broadcast helpdesk channel.
- `listSupportNotifications(staffId)`: High-priority ticket alerts, complaint assignments, and system notices.
- `logStaffActivity(staffId, action, targetId, details)`: Audit trail recorder.

---

## 🌐 Phase 3: Support Staff Gateway REST API & DTOs

Create `src/gateway/support-staff.gateway.controller.ts` with 16 REST endpoints under `/support-staff/*`:

| # | HTTP Method | Route | Description | RBAC |
|---|---|---|---|---|
| **1** | `GET` | `/support-staff/dashboard` | Support dashboard KPI metrics & urgent queue | `SUPPORT_STAFF, ADMIN` |
| **2** | `GET` | `/support-staff/tickets` | List, search & filter support tickets | `SUPPORT_STAFF, ADMIN` |
| **3** | `GET` | `/support-staff/tickets/:id` | Get ticket conversation thread & internal notes | `SUPPORT_STAFF, ADMIN` |
| **4** | `POST` | `/support-staff/tickets` | Create support ticket on behalf of patient | `SUPPORT_STAFF, ADMIN` |
| **5** | `POST` | `/support-staff/tickets/:id/reply` | Send reply message or add internal staff note | `SUPPORT_STAFF, ADMIN` |
| **6** | `PATCH` | `/support-staff/tickets/:id/assign` | Assign ticket to support agent | `SUPPORT_STAFF, ADMIN` |
| **7** | `PATCH` | `/support-staff/tickets/:id/status` | Change status (`RESOLVED`, `CLOSED`, etc.) | `SUPPORT_STAFF, ADMIN` |
| **8** | `GET` | `/support-staff/complaints` | List patient complaints & disputes | `SUPPORT_STAFF, ADMIN` |
| **9** | `GET` | `/support-staff/complaints/:id` | Get complaint investigation details | `SUPPORT_STAFF, ADMIN` |
| **10**| `PATCH` | `/support-staff/complaints/:id/status` | Update complaint status (Investigate, Respond) | `SUPPORT_STAFF, ADMIN` |
| **11**| `POST` | `/support-staff/complaints/:id/escalate` | Escalate sensitive complaint to Admin | `SUPPORT_STAFF, ADMIN` |
| **12**| `GET` | `/support-staff/patients` | Search patient directory (privacy-masked) | `SUPPORT_STAFF, ADMIN` |
| **13**| `POST` | `/support-staff/patients/:id/resend` | Resend verification SMS / password reset | `SUPPORT_STAFF, ADMIN` |
| **14**| `GET` | `/support-staff/appointments/flagged`| List appointments with pending issues | `SUPPORT_STAFF, ADMIN` |
| **15**| `POST` | `/support-staff/appointments/:id/reschedule` | Reschedule appointment with audit trail | `SUPPORT_STAFF, ADMIN` |
| **16**| `GET` | `/support-staff/activity-logs` | Retrieve recent support staff activity logs | `SUPPORT_STAFF, ADMIN` |

---

## ⚡ Phase 4: Real-Time Communication & Live Ticket Stream

- **Support Live Event Bus (`LiveSupportEventService`):**
  - Event triggers for: `NEW_TICKET_CREATED`, `TICKET_ASSIGNED`, `TICKET_RESOLVED`, `COMPLAINT_ESCALATED`, `NEW_CHAT_MESSAGE`.
- **Server-Sent Events (SSE):**
  - `GET /support-staff/events/stream`: Real-time stream pushing instant audio/toast alerts when new urgent tickets or complaint escalations arrive.
- **WebSocket / Live Chat Channel:**
  - Fast messaging synchronization between support agents and patients.

---

## 🔒 Phase 5: Security, Privacy & HIPAA/GDPR Compliance

1. **Role-Based Access Control (`RolesGuard`):**
   - Endpoints protected with `@Roles(UserRole.SUPPORT_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN)`.
2. **Strict Medical EHR Redaction:**
   - Patient search endpoints explicitly exclude `prescriptions`, `medicalRecords`, `clinicalNotes`, and `cardTokens`.
3. **Escalation Security:**
   - High-severity doctor misconduct complaints require mandatory transfer to clinic management with immutable audit timestamps.
4. **Comprehensive Activity Trail:**
   - Every status update, message sent, ticket assignment, and resend action logs IP address, actor ID, and target ID in `support_activities`.

---

## 🧪 Phase 6: Verification & Automated Testing Checklist

- [ ] **Unit Tests for Support Service (`support.service.spec.ts`):**
  - Test dashboard KPI calculations.
  - Test ticket creation, assignment, and status transitions.
  - Test complaint escalation trigger.
  - Test patient search data sanitization (verifying no EHR leak).
- [ ] **Unit Tests for Gateway Controller (`support-staff.gateway.controller.spec.ts`):**
  - Test HTTP endpoints, role guards, DTO validations.
- [ ] **Swagger OpenAPI Documentation:**
  - Annotate with `@ApiTags('Support Staff Portal')`, `@ApiBearerAuth('JWT-auth')`, `@ApiOperation`, `@ApiResponse`.
- [ ] **Build & Integration Test:**
  - `npm test` passing 100%.
  - `npm run build` compiling cleanly with 0 errors.

---

### 🚀 Recommended Next Step:
Would you like to proceed with **Phase 1: Database & Prisma Schema Design** (creating `support-ticket.prisma`, `complaint.prisma`, `support-activity.prisma` and updating relations)?
