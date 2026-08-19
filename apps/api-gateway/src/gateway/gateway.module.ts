import { Module } from '@nestjs/common';
import { BrokerClientModule } from '../../../../libs/broker/src';
import { LiveSupportEventService } from '../../../../src/common/events/live-support-event.service';
import { LiveQueueEventService } from '../../../../src/common/events/live-queue-event.service';
import { RbacService } from './services/rbac.service';
import { SystemService } from './services/system.service';
import { SupportService } from './services/support.service';
import { AdminAnalyticsGatewayController } from './admin-analytics.gateway.controller';
import { AdminDoctorGatewayController } from './admin-doctor.gateway.controller';
import { AdminPatientGatewayController } from './admin-patient.gateway.controller';
import { AdminClinicGatewayController } from './admin-clinic.gateway.controller';
import { AdminAppointmentGatewayController } from './admin-appointment.gateway.controller';
import { AdminFinanceGatewayController } from './admin-finance.gateway.controller';
import { AdminReviewGatewayController } from './admin-review.gateway.controller';
import { AdminNotificationGatewayController } from './admin-notification.gateway.controller';
import { AdminAuditGatewayController } from './admin-audit.gateway.controller';
import { SuperAdminRbacGatewayController } from './super-admin-rbac.gateway.controller';
import { SuperAdminSystemGatewayController } from './super-admin-system.gateway.controller';
import { PatientGatewayController } from './patient.gateway.controller';
import { PublicPaymentGatewayController } from './public-payment.gateway.controller';
import { PublicGatewayController } from './public.gateway.controller';
import { ReceptionistGatewayController } from './receptionist.gateway.controller';
import { SupportStaffGatewayController } from './support-staff.gateway.controller';
import { DoctorGatewayController } from './doctor.gateway.controller';
import { ChatGatewayController } from './chat.gateway.controller';
import { ClinicManagerGatewayController } from './clinic-manager.gateway.controller';

// Direct services used by legacy controllers
import { DoctorService } from '../../../doctor-service/src/doctor/doctor.service';
import { ClinicService } from '../../../clinic-service/src/clinic/clinic.service';
import { AnalyticsService } from '../../../analytics-service/src/analytics/analytics.service';
import { AppointmentService } from '../../../appointment-service/src/appointment/appointment.service';
import { PatientService } from '../../../patient-service/src/patient/patient.service';
import { AuditService } from '../../../audit-service/src/audit/audit.service';
import { ReviewService } from './services/review.service';
import { PrismaService as DoctorPrismaService } from '../../../doctor-service/src/prisma/prisma.service';
import { PrismaService as ClinicPrismaService } from '../../../clinic-service/src/prisma/prisma.service';
import { PrismaService as AppointmentPrismaService } from '../../../appointment-service/src/prisma/prisma.service';
import { PrismaService as PatientPrismaService } from '../../../patient-service/src/prisma/prisma.service';
import { PrismaService as AuditPrismaService } from '../../../audit-service/src/prisma/prisma.service';

@Module({
  imports: [
    BrokerClientModule,
  ],
  controllers: [
    AdminAnalyticsGatewayController,
    AdminDoctorGatewayController,
    AdminPatientGatewayController,
    AdminClinicGatewayController,
    AdminAppointmentGatewayController,
    AdminFinanceGatewayController,
    AdminReviewGatewayController,
    AdminNotificationGatewayController,
    AdminAuditGatewayController,
    SuperAdminRbacGatewayController,
    SuperAdminSystemGatewayController,
    PatientGatewayController,
    PublicPaymentGatewayController,
    PublicGatewayController,
    ReceptionistGatewayController,
    SupportStaffGatewayController,
    DoctorGatewayController,
    ChatGatewayController,
    ClinicManagerGatewayController,
  ],
  providers: [
    RbacService,
    SystemService,
    SupportService,
    ReviewService,
    LiveSupportEventService,
    LiveQueueEventService,
    DoctorService,
    ClinicService,
    AnalyticsService,
    AppointmentService,
    PatientService,
    AuditService,
    DoctorPrismaService,
    ClinicPrismaService,
    AppointmentPrismaService,
    PatientPrismaService,
    AuditPrismaService,
  ],
})
export class GatewayModule {}
