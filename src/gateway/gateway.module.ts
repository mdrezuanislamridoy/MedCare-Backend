import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AnalyticsModule } from '../microservices/analytics/analytics.module';
import { DoctorModule } from '../microservices/doctor/doctor.module';
import { PatientModule } from '../microservices/patient/patient.module';
import { ClinicModule } from '../microservices/clinic/clinic.module';
import { AppointmentModule } from '../microservices/appointment/appointment.module';
import { FinanceModule } from '../microservices/finance/finance.module';
import { ReviewModule } from '../microservices/review/review.module';
import { NotificationModule } from '../microservices/notification/notification.module';
import { AuditModule } from '../microservices/audit/audit.module';
import { RbacModule } from '../microservices/rbac/rbac.module';
import { SystemModule } from '../microservices/system/system.module';
import { SupportModule } from '../microservices/support/support.module';
import { ChatModule } from '../microservices/chat/chat.module';

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
import { ReceptionistGatewayController } from './receptionist.gateway.controller';
import { SupportStaffGatewayController } from './support-staff.gateway.controller';
import { DoctorGatewayController } from './doctor.gateway.controller';
import { ChatGatewayController } from './chat.gateway.controller';
import { ClinicManagerGatewayController } from './clinic-manager.gateway.controller';

@Module({
  imports: [
    CommonModule,
    AnalyticsModule,
    DoctorModule,
    PatientModule,
    ClinicModule,
    AppointmentModule,
    FinanceModule,
    ReviewModule,
    NotificationModule,
    AuditModule,
    RbacModule,
    SystemModule,
    SupportModule,
    ChatModule,
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
    ReceptionistGatewayController,
    SupportStaffGatewayController,
    DoctorGatewayController,
    ChatGatewayController,
    ClinicManagerGatewayController,
  ],
})
export class GatewayModule {}
