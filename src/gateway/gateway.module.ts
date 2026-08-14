import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../microservices/analytics/analytics.module';
import { DoctorModule } from '../microservices/doctor/doctor.module';
import { PatientModule } from '../microservices/patient/patient.module';
import { ClinicModule } from '../microservices/clinic/clinic.module';
import { AppointmentModule } from '../microservices/appointment/appointment.module';
import { AdminAnalyticsGatewayController } from './admin-analytics.gateway.controller';
import { AdminDoctorGatewayController } from './admin-doctor.gateway.controller';
import { AdminPatientGatewayController } from './admin-patient.gateway.controller';
import { AdminClinicGatewayController } from './admin-clinic.gateway.controller';
import { AdminAppointmentGatewayController } from './admin-appointment.gateway.controller';

@Module({
  imports: [
    AnalyticsModule,
    DoctorModule,
    PatientModule,
    ClinicModule,
    AppointmentModule,
  ],
  controllers: [
    AdminAnalyticsGatewayController,
    AdminDoctorGatewayController,
    AdminPatientGatewayController,
    AdminClinicGatewayController,
    AdminAppointmentGatewayController,
  ],
})
export class GatewayModule {}
