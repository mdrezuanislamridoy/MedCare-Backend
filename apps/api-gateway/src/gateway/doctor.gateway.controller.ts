import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Put,
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
  ApiParam,
} from '@nestjs/swagger';
import { Observable, interval, map, merge } from 'rxjs';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { LiveQueueEventService } from '../common/events/live-queue-event.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import {
  DoctorScheduleDto,
  SaveConsultationNotesDto,
  CreateDoctorPrescriptionDto,
  DoctorAppointmentFilterDto,
  DoctorPrescriptionFilterDto,
  DoctorPatientFilterDto,
  DoctorReviewFilterDto,
  DoctorPayoutRequestDto,
  DoctorReplyReviewDto,
  UpdateDoctorProfileDto,
} from '../microservices/doctor/dto/doctor.dto';

@ApiTags('Doctor Portal')
@ApiBearerAuth('JWT-auth')
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class DoctorGatewayController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly queueEventService: LiveQueueEventService,
  ) {}

  // ==========================================
  // 1. DASHBOARD OVERVIEW & KPIS
  // ==========================================
  @ApiOperation({
    summary:
      'Get doctor dashboard metrics, upcoming appointment, and active queue',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics returned successfully',
  })
  @Get('dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest) {
    return this.doctorService.doctorGetDashboard(req.user.id);
  }

  // ==========================================
  // 2. CONSULTATION WORKSPACE & NOTES
  // ==========================================
  @ApiOperation({
    summary:
      'Get patient clinical medical chart and consultation workspace for an appointment',
  })
  @ApiResponse({
    status: 200,
    description: 'Consultation workspace data returned',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'Appointment ID',
    example: 'apt-1001',
  })
  @Get([
    'consultations/:appointmentId',
    'consultations/:appointmentId/note',
    'consultations/:appointmentId/notes',
  ])
  async getConsultationWorkspace(
    @Req() req: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.doctorService.doctorGetConsultationWorkspace(
      req.user.id,
      appointmentId,
    );
  }

  @ApiOperation({
    summary:
      'Save patient symptoms, clinical diagnosis, vitals, and treatment plan',
  })
  @ApiResponse({
    status: 200,
    description: 'Clinical consultation notes saved',
  })
  @ApiParam({
    name: 'appointmentId',
    description: 'Appointment ID',
    example: 'apt-1001',
  })
  @Post([
    'consultations/:appointmentId/notes',
    'consultations/:appointmentId/note',
  ])
  async saveConsultationNotes(
    @Req() req: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
    @Body() body: SaveConsultationNotesDto,
  ) {
    return this.doctorService.doctorSaveConsultationNotes(
      req.user.id,
      appointmentId,
      body,
    );
  }

  @ApiOperation({
    summary:
      'Complete consultation, update queue token status, and credit earnings',
  })
  @ApiResponse({ status: 200, description: 'Consultation completed' })
  @ApiParam({
    name: 'appointmentId',
    description: 'Appointment ID',
    example: 'apt-1001',
  })
  @Post('consultations/:appointmentId/complete')
  async completeConsultation(
    @Req() req: AuthenticatedRequest,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.doctorService.doctorCompleteConsultation(
      req.user.id,
      appointmentId,
    );
  }

  // ==========================================
  // 3. DIGITAL PRESCRIPTIONS
  // ==========================================
  @ApiOperation({
    summary:
      'Create digital prescription with medicine list, dosage, instructions, and advice',
  })
  @ApiResponse({
    status: 201,
    description: 'Prescription created successfully',
  })
  @Post('prescriptions')
  async createPrescription(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateDoctorPrescriptionDto,
  ) {
    return this.doctorService.doctorCreatePrescription(req.user.id, body);
  }

  @ApiOperation({
    summary:
      'List prescriptions issued by current doctor with patient search and pagination',
  })
  @ApiResponse({ status: 200, description: 'Prescriptions list returned' })
  @Get('prescriptions')
  async listPrescriptions(
    @Req() req: AuthenticatedRequest,
    @Query() query: DoctorPrescriptionFilterDto,
  ) {
    return this.doctorService.doctorListPrescriptions(req.user.id, query);
  }

  @ApiOperation({
    summary: 'Get prescription details, medicines breakdown, and print preview',
  })
  @ApiResponse({ status: 200, description: 'Prescription details returned' })
  @ApiParam({ name: 'id', description: 'Prescription ID', example: 'rx-1001' })
  @Get('prescriptions/:id')
  async getPrescriptionDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.doctorService.doctorGetPrescriptionDetails(req.user.id, id);
  }

  // ==========================================
  // 4. APPOINTMENTS & STATUS UPDATES
  // ==========================================
  @ApiOperation({
    summary:
      'List doctor appointments with date, status, and consultation type filters',
  })
  @ApiResponse({ status: 200, description: 'Appointments list returned' })
  @Get('appointments')
  async listAppointments(
    @Req() req: AuthenticatedRequest,
    @Query() query: DoctorAppointmentFilterDto,
  ) {
    return this.doctorService.doctorListAppointments(req.user.id, query);
  }

  @ApiOperation({
    summary:
      'Get single appointment details including patient, queue token, and notes',
  })
  @ApiResponse({ status: 200, description: 'Appointment details returned' })
  @ApiParam({ name: 'id', description: 'Appointment ID', example: 'apt-1001' })
  @Get('appointments/:id')
  async getAppointmentDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.doctorService.doctorGetAppointmentDetails(req.user.id, id);
  }

  @ApiOperation({
    summary:
      'Update appointment status (CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED)',
  })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Patch(['appointments/:id/status', 'appointments/:id'])
  async updateAppointmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.doctorService.doctorUpdateAppointmentStatus(
      req.user.id,
      id,
      body.status,
      body.notes,
    );
  }

  @ApiOperation({
    summary:
      'Generate WebRTC / Agora video channel token for online teleconsultation',
  })
  @ApiResponse({
    status: 200,
    description: 'Video session room and token generated',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID', example: 'apt-1001' })
  @Get(['appointments/:id/video-session', 'video-sessions/:id/token'])
  @Post('video-sessions/:id/token')
  async getVideoSessionToken(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.doctorService.doctorGetVideoSessionToken(req.user.id, id);
  }

  // ==========================================
  // 5. PATIENTS DIRECTORY & MEDICAL RECORDS
  // ==========================================
  @ApiOperation({
    summary: 'List patients who have consulted with this doctor',
  })
  @ApiResponse({ status: 200, description: 'Patients directory returned' })
  @Get('patients')
  async listPatients(
    @Req() req: AuthenticatedRequest,
    @Query() query: DoctorPatientFilterDto,
  ) {
    return this.doctorService.doctorListPatients(req.user.id, query);
  }

  @ApiOperation({
    summary: 'View patient uploaded lab test reports and clinical records',
  })
  @ApiResponse({ status: 200, description: 'Medical records list returned' })
  @ApiParam({
    name: 'id',
    description: 'Patient Profile ID',
    example: 'pat-1001',
  })
  @Get(['patients/:id/medical-records', 'patients/:id/chart'])
  async getPatientMedicalRecords(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.doctorService.doctorGetPatientMedicalRecords(req.user.id, id);
  }

  // ==========================================
  // 6. SCHEDULE & AVAILABILITY
  // ==========================================
  @ApiOperation({
    summary:
      'Get doctor weekly working hours, break intervals, and consultation fee',
  })
  @ApiResponse({ status: 200, description: 'Weekly schedule returned' })
  @Get(['schedule', 'schedules'])
  async getSchedule(@Req() req: AuthenticatedRequest) {
    return this.doctorService.doctorGetSchedule(req.user.id);
  }

  @ApiOperation({
    summary:
      'Update weekly working schedule, day-offs, slot duration, and consultation fee',
  })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @Put(['schedule', 'schedules'])
  @Post('schedules')
  async updateSchedule(
    @Req() req: AuthenticatedRequest,
    @Body() body: DoctorScheduleDto,
  ) {
    return this.doctorService.doctorUpdateSchedule(req.user.id, body);
  }

  // ==========================================
  // 7. FINANCIAL EARNINGS & PAYOUTS
  // ==========================================
  @ApiOperation({
    summary:
      'Get doctor earnings summary, platform commission, chart data, and transaction list',
  })
  @ApiResponse({ status: 200, description: 'Earnings analytics returned' })
  @Get('earnings')
  async getEarnings(@Req() req: AuthenticatedRequest) {
    return this.doctorService.doctorGetEarningsSummary(req.user.id);
  }

  @ApiOperation({
    summary: 'Submit withdrawal / payout request for pending balance',
  })
  @ApiResponse({ status: 201, description: 'Payout request registered' })
  @Post(['earnings/payout-request', 'payouts/request'])
  async requestPayout(
    @Req() req: AuthenticatedRequest,
    @Body() body: DoctorPayoutRequestDto,
  ) {
    return this.doctorService.doctorRequestPayout(req.user.id, body);
  }

  // ==========================================
  // 8. PATIENT REVIEWS & RATINGS
  // ==========================================
  @ApiOperation({
    summary:
      'List patient reviews, star rating distribution (5★ to 1★), and recommendation rate',
  })
  @ApiResponse({ status: 200, description: 'Reviews list returned' })
  @Get('reviews')
  async listReviews(
    @Req() req: AuthenticatedRequest,
    @Query() query: DoctorReviewFilterDto,
  ) {
    return this.doctorService.doctorListReviews(req.user.id, query);
  }

  @ApiOperation({ summary: 'Reply to a patient review feedback' })
  @ApiResponse({ status: 200, description: 'Reply submitted' })
  @ApiParam({ name: 'id', description: 'Review ID', example: 'rev-1001' })
  @Post('reviews/:id/reply')
  async replyReview(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: DoctorReplyReviewDto,
  ) {
    return this.doctorService.doctorReplyReview(req.user.id, id, body.reply);
  }

  // ==========================================
  // 9. DOCTOR PROFILE MANAGEMENT
  // ==========================================
  @ApiOperation({
    summary:
      'Get logged in doctor profile, clinic branch, and verification status',
  })
  @ApiResponse({ status: 200, description: 'Doctor profile returned' })
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.doctorService.doctorGetProfile(req.user.id);
  }

  @ApiOperation({
    summary:
      'Update doctor bio, qualifications, experience, room number, or phone',
  })
  @ApiResponse({ status: 200, description: 'Doctor profile updated' })
  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateDoctorProfileDto,
  ) {
    return this.doctorService.doctorUpdateProfile(req.user.id, body);
  }

  // ==========================================
  // 10. REAL-TIME LIVE QUEUE STREAM (SSE)
  // ==========================================
  @ApiOperation({
    summary:
      'Server-Sent Events (SSE) stream for real-time live patient check-in & queue alerts',
  })
  @ApiResponse({ status: 200, description: 'SSE stream connected' })
  @Sse('queue/stream')
  streamDoctorQueueEvents(): Observable<MessageEvent> {
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
}
