import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
})
export class GatewayModule {}
