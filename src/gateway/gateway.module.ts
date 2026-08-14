import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../microservices/analytics/analytics.module';
import { DoctorModule } from '../microservices/doctor/doctor.module';
import { PatientModule } from '../microservices/patient/patient.module';
import { ClinicModule } from '../microservices/clinic/clinic.module';
import { AppointmentModule } from '../microservices/appointment/appointment.module';
import { FinanceModule } from '../microservices/finance/finance.module';
import { ReviewModule } from '../microservices/review/review.module';
import { AdminAnalyticsGatewayController } from './admin-analytics.gateway.controller';
import { AdminDoctorGatewayController } from './admin-doctor.gateway.controller';
import { AdminPatientGatewayController } from './admin-patient.gateway.controller';
import { AdminClinicGatewayController } from './admin-clinic.gateway.controller';
import { AdminAppointmentGatewayController } from './admin-appointment.gateway.controller';
import { AdminFinanceGatewayController } from './admin-finance.gateway.controller';
import { AdminReviewGatewayController } from './admin-review.gateway.controller';

@Module({
  imports: [
    AnalyticsModule,
    DoctorModule,
    PatientModule,
    ClinicModule,
    AppointmentModule,
    FinanceModule,
    ReviewModule,
  ],
  controllers: [
    AdminAnalyticsGatewayController,
    AdminDoctorGatewayController,
    AdminPatientGatewayController,
    AdminClinicGatewayController,
    AdminAppointmentGatewayController,
    AdminFinanceGatewayController,
    AdminReviewGatewayController,
  ],
})
export class GatewayModule {}
