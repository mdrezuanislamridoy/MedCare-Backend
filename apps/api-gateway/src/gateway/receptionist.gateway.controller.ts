import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { interval, map, merge, Observable } from 'rxjs';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../libs/auth/src';
import { Public } from '../../../../libs/auth/src';
import { UserRole, QueueStatus } from '@medcare/contracts';
import type { AuthenticatedRequest } from '../../../../src/common/types/authenticated-request.type';

import { AppointmentService } from '../../../appointment-service/src/appointment/appointment.service';
import { DoctorService } from '../../../doctor-service/src/doctor/doctor.service';
import { PatientService } from '../../../patient-service/src/patient/patient.service';
import { AuditService } from '../../../audit-service/src/audit/audit.service';
import { LiveQueueEventService } from '../../../../src/common/events/live-queue-event.service';

import {
  AppointmentFilterDto,
  ReceptionistCheckInDto,
  ReceptionistUpdateQueueDto,
  ReceptionistWalkInBookingDto,
  RescheduleAppointmentDto,
} from '../../../appointment-service/src/appointment/dto/appointment.dto';

@ApiTags('Receptionist Portal')
@ApiBearerAuth('JWT-auth')
@Controller('receptionist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.RECEPTIONIST,
  UserRole.CLINIC_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
export class ReceptionistGatewayController {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly doctorService: DoctorService,
    private readonly patientService: PatientService,
    private readonly auditService: AuditService,
    private readonly queueEventService: LiveQueueEventService,
  ) {}

  // 1. Dashboard Overview
  @ApiOperation({
    summary: "Get receptionist dashboard overview, today's KPIs, and timeline",
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics and live queue summary returned',
  })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    description: 'Filter by specific clinic ID',
  })
  @Get('dashboard')
  async getDashboard(@Query('clinicId') clinicId?: string) {
    return this.appointmentService.receptionistGetDashboardStats(clinicId);
  }

  // 2. Appointments List & Filters
  @ApiOperation({ summary: 'List and filter all clinic appointments' })
  @ApiResponse({
    status: 200,
    description: 'Paginated appointment list returned',
  })
  @Get('appointments')
  async listAppointments(@Query() filter: AppointmentFilterDto) {
    return this.appointmentService.listAppointments(filter);
  }

  // 3. Reschedule Appointment
  @ApiOperation({ summary: 'Reschedule an existing appointment date or time' })
  @ApiResponse({
    status: 200,
    description: 'Appointment successfully rescheduled',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Patch('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.reschedule(id, dto, req.user?.id);
  }

  // 4. Cancel Appointment
  @ApiOperation({ summary: 'Cancel an appointment with cancellation reason' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Patch('appointments/:id/cancel')
  async cancelAppointment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.transitionStatus(
      id,
      { status: 'CANCELLED', cancellationReason: reason },
      req.user?.id,
    );
  }

  // 5. 6-Step Patient Check-In Execution
  @ApiOperation({
    summary:
      'Execute patient check-in, assign daily token # and consultation room',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient checked in and added to Live Queue',
  })
  @Post('check-in')
  async checkInPatient(
    @Body() dto: ReceptionistCheckInDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistCheckIn(dto, req.user?.id);
  }

  // 6. Live Patient Queue
  @ApiOperation({ summary: "Get today's live patient queue table" })
  @ApiResponse({ status: 200, description: 'Active patient queue returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @Get('queue')
  async getLiveQueue(
    @Query('clinicId') clinicId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentService.receptionistGetLiveQueue(clinicId, doctorId);
  }

  // 7. Transition Queue Status (Call, In Room, Complete, No Show)
  @ApiOperation({
    summary: 'Update queue entry status (CALLED, IN_ROOM, COMPLETED, NO_SHOW)',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status updated and broadcasted',
  })
  @ApiParam({ name: 'id', description: 'Queue Entry ID' })
  @Patch('queue/:id/status')
  async updateQueueStatus(
    @Param('id') id: string,
    @Body() dto: ReceptionistUpdateQueueDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistUpdateQueueStatus(
      id,
      dto.status,
      req.user?.id,
    );
  }

  // 8. Doctors Status & Room Directory
  @ApiOperation({
    summary: 'Get doctor attendance, room numbers, and active queue length',
  })
  @ApiResponse({ status: 200, description: 'Doctor status list returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('doctors')
  async listDoctorsStatus(@Query('clinicId') clinicId?: string) {
    return this.doctorService.receptionistGetDoctorStatusList(clinicId);
  }

  // 9. Doctor Schedule Grid Matrix (08:00 - 17:00)
  @ApiOperation({
    summary:
      'Get 08:00 - 17:00 hourly appointment schedule matrix across all doctors',
  })
  @ApiResponse({ status: 200, description: 'Schedule grid matrix returned' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Target date (YYYY-MM-DD)',
  })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('schedule')
  async getScheduleGrid(
    @Query('date') date?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.doctorService.receptionistGetScheduleGrid(date, clinicId);
  }

  // 10. Walk-In Appointment Booking
  @ApiOperation({
    summary: 'Create walk-in appointment and immediately queue the patient',
  })
  @ApiResponse({
    status: 201,
    description: 'Walk-in booking created and queued',
  })
  @Post('schedule/walk-in')
  async createWalkInBooking(
    @Body() dto: ReceptionistWalkInBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.receptionistWalkInBooking(dto, req.user?.id);
  }

  // 11. Patient Directory Search
  @ApiOperation({
    summary:
      'Search clinic patient directory by name, phone, or ID with visit history',
  })
  @ApiResponse({ status: 200, description: 'Patient directory list returned' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
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
  @ApiOperation({ summary: 'Get front-desk timestamped audit activity logs' })
  @ApiResponse({ status: 200, description: 'Audit log entries returned' })
  @ApiQuery({ name: 'limit', required: false, default: 20 })
  @Get('activity')
  async getActivityLogs(@Query('limit') limit?: string) {
    return this.auditService.listLogs({
      limit: limit ? parseInt(limit, 10) : 20,
      q: 'Receptionist',
    });
  }

  // 13. Real-Time Live Queue Event Stream (SSE)
  @ApiOperation({
    summary:
      'Server-Sent Events (SSE) stream for live queue updates and display boards',
  })
  @ApiResponse({ status: 200, description: 'SSE stream connected' })
  @Public()
  @Sse('queue/stream')
  streamQueueEvents(): Observable<MessageEvent> {
    const queueEvents$ = this.queueEventService.getStream().pipe(
      map((event) => ({
        data: event,
        type: 'queue-event',
      })),
    );

    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT', timestamp: new Date().toISOString() },
        type: 'heartbeat',
      })),
    );

    return merge(queueEvents$, heartbeat$);
  }

  // 14. Waiting Lounge TV / Display Board View
  @ApiOperation({
    summary: 'Public endpoint for Waiting Room TV display screens',
  })
  @ApiResponse({
    status: 200,
    description: 'Live display board state returned',
  })
  @ApiQuery({ name: 'clinicId', required: false })
  @Public()
  @Get('queue/display')
  async getDisplayBoard(@Query('clinicId') clinicId?: string) {
    const activeQueue =
      await this.appointmentService.receptionistGetLiveQueue(clinicId);
    const currentlyCalled = activeQueue.filter(
      (q) =>
        q.status === QueueStatus.CALLED || q.status === QueueStatus.IN_ROOM,
    );
    const waitingList = activeQueue.filter(
      (q) => q.status === QueueStatus.WAITING,
    );

    return {
      activeCount: activeQueue.length,
      currentlyCalled: currentlyCalled.map((q) => ({
        queueNumber: q.queueNumber,
        patientName: q.patient.user.name,
        doctorName: q.doctor.user.name,
        roomNumber: q.roomNumber || 'Room 101',
        status: q.status,
      })),
      waitingList: waitingList.map((q) => ({
        queueNumber: q.queueNumber,
        patientName: q.patient.user.name,
        doctorName: q.doctor.user.name,
        roomNumber: q.roomNumber || 'Room 101',
      })),
    };
  }
}
