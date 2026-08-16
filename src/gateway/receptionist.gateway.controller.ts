import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, QueueStatus } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

import { AppointmentService } from '../microservices/appointment/appointment.service';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { PatientService } from '../microservices/patient/patient.service';
import { AuditService } from '../microservices/audit/audit.service';

import {
  AppointmentFilterDto,
  ReceptionistCheckInDto,
  ReceptionistUpdateQueueDto,
  ReceptionistWalkInBookingDto,
  RescheduleAppointmentDto,
} from '../microservices/appointment/dto/appointment.dto';

@Controller('receptionist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RECEPTIONIST, UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ReceptionistGatewayController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly doctorService: DoctorService,
    private readonly patientService: PatientService,
    private readonly auditService: AuditService,
  ) {}

  // 1. Dashboard Overview
  @Get('dashboard')
  async getDashboard(@Query('clinicId') clinicId?: string) {
    return this.appointmentService.receptionistGetDashboardStats(clinicId);
  }

  // 2. Appointments List & Filters
  @Get('appointments')
  async listAppointments(@Query() filter: AppointmentFilterDto) {
    return this.appointmentService.listAppointments(filter);
  }

  // 3. Reschedule Appointment
  @Patch('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.reschedule(id, dto, req.user?.id);
  }

  // 4. Cancel Appointment
  @Patch('appointments/:id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.transitionStatus(
      id,
      { status: 'CANCELLED' as any, cancellationReason: reason },
      req.user?.id,
    );
  }

  // 5. 6-Step Patient Check-In Execution
  @Post('check-in')
  async checkInPatient(
    @Body() dto: ReceptionistCheckInDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistCheckIn(dto, req.user?.id);
  }

  // 6. Live Patient Queue
  @Get('queue')
  async getLiveQueue(
    @Query('clinicId') clinicId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentService.receptionistGetLiveQueue(clinicId, doctorId);
  }

  // 7. Transition Queue Status (Call, In Room, Complete, No Show)
  @Patch('queue/:id/status')
  async updateQueueStatus(
    @Param('id') id: string,
    @Body() dto: ReceptionistUpdateQueueDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistUpdateQueueStatus(id, dto.status, req.user?.id);
  }

  // 8. Doctors Status & Room Directory
  @Get('doctors')
  async listDoctorsStatus(@Query('clinicId') clinicId?: string) {
    return this.doctorService.receptionistGetDoctorStatusList(clinicId);
  }

  // 9. Doctor Schedule Grid Matrix (08:00 - 17:00)
  @Get('schedule')
  async getScheduleGrid(
    @Query('date') date?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.doctorService.receptionistGetScheduleGrid(date, clinicId);
  }

  // 10. Walk-In Appointment Booking
  @Post('schedule/walk-in')
  async createWalkInBooking(
    @Body() dto: ReceptionistWalkInBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistWalkInBooking(dto, req.user?.id);
  }

  // 11. Patient Directory Search
  @Get('patients')
  async searchPatients(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patientService.receptionistSearchPatients(
      q,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // 12. Front-Desk Activity Log
  @Get('activity')
  async getActivityLogs(@Query('limit') limit?: string) {
    return this.auditService.listLogs({
      limit: limit ? parseInt(limit, 10) : 20,
      q: 'Receptionist',
    });
  }
}
