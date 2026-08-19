# MedCare Project - Global Overview & Progress

## 📌 Project Architecture
- **Frontend**: Next.js React Portal (`/Volumes/2BT/Ridoy/MedCare`)
  - Role-based modular portals (`patient`, `doctor`, `admin`, `super-admin`, `receptionist`, `clinic-manager`, `support-staff`)
- **Backend**: NestJS Enterprise Microservices Monorepo + Caddy Ingress (`/Volumes/2BT/Ridoy/MedCare Backend`)
  - **Edge Ingress**: Caddy (`infrastructure/caddy/Caddyfile`) with automatic TLS, Gzip/Zstd compression, and WebSocket proxying
  - **11 Isolated Microservices (`apps/`)**:
    - `apps/api-gateway/` (Pure Microservices API Gateway, OpenAPI Swagger, ClientProxy routing in `src/modules/`)
    - `apps/auth-service/` (Auth, JWT, OAuth, Password Management)
    - `apps/doctor-service/` (Doctor clinical workspace, consultation notes, e-prescriptions)
    - `apps/patient-service/` (Patient health metrics, medical records, booking)
    - `apps/appointment-service/` (Appointment scheduling, 6-step check-in, live queue)
    - `apps/billing-service/` (Invoices, Stripe/SSLCommerz payments, doctor payouts)
    - `apps/clinic-service/` (Clinic branches, room inventory, staff roster)
    - `apps/notification-service/` (Async email, SMS, push notifications)
    - `apps/audit-service/` (Immutable compliance & security audit logs)
    - `apps/analytics-service/` (Platform KPIs, financial reports, revenue stats)
    - `apps/chat-service/` (Real-time WebSocket chat threads & attachments)
  - **Monorepo Shared Libraries (`libs/`)**:
    - `libs/contracts/`: Shared DTOs, message patterns (`PATTERNS`), domain events (`EVENTS`), and event payloads
    - `libs/broker/`: Transport connection broker (Redis, Kafka, TCP) + `BrokerClientModule`
    - `libs/kafka/`: Kafka producer/consumer helper module
    - `libs/auth/`: JWT strategies, `@Roles()`, `@Public()`, and guards
    - `libs/logger/`: Structured distributed tracing logger
    - `libs/common/`: Shared Prisma base classes and modules
  - **Infrastructure & Docker (`infrastructure/`)**:
    - `infrastructure/caddy/Caddyfile` (Caddy edge reverse proxy)
    - `infrastructure/docker/Dockerfile.gateway` (API Gateway image)
    - `infrastructure/docker/Dockerfile.microservice` (Multi-stage parameterized image for any microservice)
    - `infrastructure/docker/init-db/01-init-databases.sh` (PostgreSQL multi-database initializer)
    - `infrastructure/docker/compose/` (Individual standalone docker-compose files per service)
    - `docker-compose.yml` (Complete multi-container orchestration for Caddy, Gateway, 11 microservices, Redis, and PostgreSQL)
  - **Database-per-Service & Multi-Database Engine**:
    - **Dedicated `prisma/schema.prisma` in each microservice (`apps/<service>/prisma/schema.prisma`)**
    - Dedicated database instances: `auth_db`, `doctor_db`, `patient_db`, `appointment_db`, `clinic_db`, `billing_db`, `audit_db`, `chat_db`, `notification_db`
    - Dedicated Prisma clients generated in `apps/<service>/src/generated/prisma/`
    - Automated provisioning via `infrastructure/docker/init-db/01-init-databases.sh`

---

## 🛠️ Prisma Generation & Migration Commands

### 1. Generate Prisma Clients (Code Generation)
- **Generate all services at once:**
  ```bash
  npm run prisma:generate:all
  ```
- **Generate for a specific service:**
  ```bash
  npm run prisma:generate:auth
  npm run prisma:generate:doctor
  npm run prisma:generate:patient
  npm run prisma:generate:appointment
  npm run prisma:generate:clinic
  npm run prisma:generate:billing
  npm run prisma:generate:notification
  npm run prisma:generate:audit
  npm run prisma:generate:chat
  ```

### 2. Database Push / Migration (Schema & Table Sync)
- **Push all schemas to databases at once (Development Sync):**
  ```bash
  npm run prisma:push:all
  ```
- **Run migration for a specific service (Production Migrations):**
  ```bash
  npm run prisma:migrate:auth
  npm run prisma:migrate:doctor
  npm run prisma:migrate:patient
  npm run prisma:migrate:appointment
  npm run prisma:migrate:clinic
  npm run prisma:migrate:billing
  npm run prisma:migrate:notification
  npm run prisma:migrate:audit
  npm run prisma:migrate:chat
  ```

---

## 🚀 Running the Project

### Hybrid Mode (Gateway + Microservices concurrently):
```bash
npm run start:dev
```

### Individual Microservices:
```bash
npm run start:gateway:dev
npm run start:auth:dev
npm run start:doctor:dev
npm run start:patient:dev
npm run start:appointment:dev
npm run start:billing:dev
npm run start:clinic:dev
npm run start:notification:dev
npm run start:audit:dev
npm run start:analytics:dev
npm run start:chat:dev
```
