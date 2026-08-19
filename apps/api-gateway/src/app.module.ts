import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrokerClientModule } from '../../../libs/broker/src';
import { validateEnv } from '../../../src/common/config/env.validation';

// Clean Domain Proxy Controllers
import { AuthGatewayController } from './modules/auth/auth.controller';
import { DoctorGatewayController } from './modules/doctors/doctor.controller';
import { PatientGatewayController } from './modules/patients/patient.controller';
import { AppointmentGatewayController } from './modules/appointments/appointment.controller';
import { BillingGatewayController } from './modules/billing/billing.controller';
import { ClinicGatewayController } from './modules/clinics/clinic.controller';
import { NotificationGatewayController } from './modules/notifications/notification.controller';
import { AuditGatewayController } from './modules/audit/audit.controller';
import { AnalyticsGatewayController } from './modules/analytics/analytics.controller';
import { ChatGatewayController } from './modules/chat/chat.controller';
import { ReceptionistGatewayController } from './modules/receptionist/receptionist.controller';
import { SuperAdminGatewayController } from './modules/super-admin/super-admin.controller';
import { SupportStaffGatewayController } from './modules/support/support.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BrokerClientModule,
  ],
  controllers: [
    AuthGatewayController,
    DoctorGatewayController,
    PatientGatewayController,
    AppointmentGatewayController,
    BillingGatewayController,
    ClinicGatewayController,
    NotificationGatewayController,
    AuditGatewayController,
    AnalyticsGatewayController,
    ChatGatewayController,
    ReceptionistGatewayController,
    SuperAdminGatewayController,
    SupportStaffGatewayController,
  ],
})
export class AppModule {}
