import { Module } from '@nestjs/common';
import { BrokerClientModule } from '../../../../libs/broker/src';
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
})
export class GatewayModule {}
