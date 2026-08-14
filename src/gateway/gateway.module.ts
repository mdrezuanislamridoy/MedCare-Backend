import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../microservices/analytics/analytics.module';
import { DoctorModule } from '../microservices/doctor/doctor.module';
import { PatientModule } from '../microservices/patient/patient.module';
import { AdminAnalyticsGatewayController } from './admin-analytics.gateway.controller';
import { AdminDoctorGatewayController } from './admin-doctor.gateway.controller';
import { AdminPatientGatewayController } from './admin-patient.gateway.controller';

@Module({
  imports: [
    AnalyticsModule,
    DoctorModule,
    PatientModule,
  ],
  controllers: [
    AdminAnalyticsGatewayController,
    AdminDoctorGatewayController,
    AdminPatientGatewayController,
  ],
})
export class GatewayModule {}
