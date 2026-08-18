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
  ApiParam,
} from '@nestjs/swagger';
import { Observable, interval, map, merge } from 'rxjs';
import { SupportService } from '../microservices/support/support.service';
import { LiveSupportEventService } from '../common/events/live-support-event.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import {
  TicketFilterDto,
  CreateTicketDto,
  ReplyTicketDto,
  AssignTicketDto,
  UpdateTicketStatusDto,
  ComplaintFilterDto,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
  EscalateComplaintDto,
  SupportPatientSearchDto,
  ResendNotificationDto,
  AssistRescheduleAppointmentDto,
  SupportActivityFilterDto,
} from '../microservices/support/dto/support.dto';

@ApiTags('Support Staff Portal')
@ApiBearerAuth('JWT-auth')
@Controller('support-staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPPORT_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SupportStaffGatewayController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportEventService: LiveSupportEventService,
  ) {}

  // ==========================================
  // 1. DASHBOARD & KPIS
  // ==========================================
  @ApiOperation({
    summary:
      'Get support staff dashboard overview, KPIs, and urgent ticket queues',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics returned successfully',
  })
  @Get('dashboard')
  async getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  // ==========================================
  // 2. SUPPORT TICKETS
  // ==========================================
  @ApiOperation({
    summary:
      'List, search, and filter support tickets by status, priority, and category',
  })
  @ApiResponse({ status: 200, description: 'Paginated tickets returned' })
  @Get('tickets')
  async listTickets(@Query() query: TicketFilterDto) {
    return this.supportService.listTickets(query);
  }

  @ApiOperation({
    summary:
      'Get full conversation thread and internal staff notes for a ticket',
  })
  @ApiResponse({ status: 200, description: 'Ticket details returned' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @Get('tickets/:id')
  async getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id);
  }

  @ApiOperation({
    summary: 'Create a new support ticket on behalf of a patient',
  })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @Post('tickets')
  async createTicket(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTicketDto,
  ) {
    return this.supportService.createTicket(req.user.id, body);
  }

  @ApiOperation({
    summary: 'Send public reply or append internal note to ticket thread',
  })
  @ApiResponse({ status: 201, description: 'Message added to thread' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @Post('tickets/:id/reply')
  async replyTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReplyTicketDto,
  ) {
    return this.supportService.replyTicket(
      id,
      req.user.id,
      req.user.email || 'Support Agent',
      req.user.role,
      body,
    );
  }

  @ApiOperation({
    summary: 'Assign or reassign ticket ownership to a support agent',
  })
  @ApiResponse({ status: 200, description: 'Ticket assigned' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @Patch('tickets/:id/assign')
  async assignTicket(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, body.staffId, req.user.id);
  }

  @ApiOperation({
    summary:
      'Transition ticket status (IN_PROGRESS, WAITING_FOR_USER, RESOLVED, CLOSED)',
  })
  @ApiResponse({ status: 200, description: 'Ticket status updated' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @Patch('tickets/:id/status')
  async updateTicketStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateTicketStatus(id, body, req.user.id);
  }

  // ==========================================
  // 3. COMPLAINTS & DISPUTES
  // ==========================================
  @ApiOperation({ summary: 'List and filter patient complaints and disputes' })
  @ApiResponse({ status: 200, description: 'Complaints list returned' })
  @Get('complaints')
  async listComplaints(@Query() query: ComplaintFilterDto) {
    return this.supportService.listComplaints(query);
  }

  @ApiOperation({
    summary: 'Get complaint investigation details and doctor references',
  })
  @ApiResponse({ status: 200, description: 'Complaint details returned' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @Get('complaints/:id')
  async getComplaintDetails(@Param('id') id: string) {
    return this.supportService.getComplaintDetails(id);
  }

  @ApiOperation({ summary: 'Log a new patient complaint / incident' })
  @ApiResponse({ status: 201, description: 'Complaint registered' })
  @Post('complaints')
  async createComplaint(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateComplaintDto,
  ) {
    return this.supportService.createComplaint(req.user.id, body);
  }

  @ApiOperation({
    summary:
      'Update complaint status (UNDER_INVESTIGATION, RESPONDED, RESOLVED)',
  })
  @ApiResponse({ status: 200, description: 'Complaint status updated' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @Patch('complaints/:id/status')
  async updateComplaintStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateComplaintStatusDto,
  ) {
    return this.supportService.updateComplaintStatus(id, body, req.user.id);
  }

  @ApiOperation({
    summary:
      'Escalate severe patient complaint to Clinic Management / Super Admin',
  })
  @ApiResponse({ status: 200, description: 'Complaint escalated to admin' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @Post('complaints/:id/escalate')
  async escalateComplaint(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: EscalateComplaintDto,
  ) {
    return this.supportService.escalateComplaint(id, body, req.user.id);
  }

  // ==========================================
  // 4. PRIVACY-PRESERVED PATIENT LOOKUP (HIPAA-Safe)
  // ==========================================
  @ApiOperation({
    summary:
      'Search patients by name, email, phone, or ID (excludes EHR/medical history)',
  })
  @ApiResponse({
    status: 200,
    description: 'Patient directory results returned',
  })
  @Get('patients')
  async searchPatients(@Query() query: SupportPatientSearchDto) {
    return this.supportService.searchPatients(query);
  }

  @ApiOperation({
    summary: 'Trigger resend of patient verification email or appointment SMS',
  })
  @ApiResponse({ status: 200, description: 'Notification dispatched' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @Post('patients/:id/resend')
  async resendPatientNotification(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ResendNotificationDto,
  ) {
    return this.supportService.resendPatientNotification(
      id,
      body.type,
      req.user.id,
    );
  }

  // ==========================================
  // 5. APPOINTMENT ISSUE ASSISTANCE
  // ==========================================
  @ApiOperation({
    summary:
      'List appointments flagged with patient issues or requiring assistance',
  })
  @ApiResponse({ status: 200, description: 'Flagged appointments returned' })
  @Get('appointments/flagged')
  async listFlaggedAppointments() {
    return this.supportService.listFlaggedAppointments();
  }

  @ApiOperation({
    summary:
      'Assist patient in rescheduling an appointment to a new date/time or doctor',
  })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Post('appointments/:id/reschedule')
  async assistRescheduleAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: AssistRescheduleAppointmentDto,
  ) {
    return this.supportService.assistRescheduleAppointment(
      id,
      body,
      req.user.id,
    );
  }

  @ApiOperation({
    summary: 'Mark appointment issue resolved and clear issue flag',
  })
  @ApiResponse({ status: 200, description: 'Flag cleared' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Patch('appointments/:id/clear-flag')
  async clearAppointmentFlag(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.supportService.clearAppointmentFlag(id, req.user.id);
  }

  // ==========================================
  // 6. STAFF ACTIVITY AUDIT LOGS
  // ==========================================
  @ApiOperation({
    summary: 'List immutable support staff action and activity audit logs',
  })
  @ApiResponse({ status: 200, description: 'Activity logs returned' })
  @Get('activity-logs')
  async listActivityLogs(@Query() query: SupportActivityFilterDto) {
    return this.supportService.listActivityLogs(query);
  }

  // ==========================================
  // 7. REAL-TIME LIVE EVENT STREAM (SSE)
  // ==========================================
  @ApiOperation({
    summary:
      'Server-Sent Events (SSE) stream for real-time ticket and escalation alerts',
  })
  @ApiResponse({ status: 200, description: 'SSE stream connected' })
  @Sse('events/stream')
  streamSupportEvents(): Observable<MessageEvent> {
    const supportEvents$ = this.supportEventService.getStream().pipe(
      map((event) => ({
        data: event,
        type: 'support-event',
      })),
    );

    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT', timestamp: new Date().toISOString() },
        type: 'heartbeat',
      })),
    );

    return merge(supportEvents$, heartbeat$);
  }
}
