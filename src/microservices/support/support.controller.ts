import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SupportService } from './support.service';
import { PATTERNS } from '../common/microservices.constants';
import {
  TicketFilterDto,
  CreateTicketDto,
  ReplyTicketDto,
  UpdateTicketStatusDto,
  ComplaintFilterDto,
  CreateComplaintDto,
  UpdateComplaintStatusDto,
  EscalateComplaintDto,
  SupportPatientSearchDto,
  AssistRescheduleAppointmentDto,
  SupportActivityFilterDto,
} from './dto/support.dto';
import { UserRole } from '../../../generated/prisma/client';

@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @MessagePattern(PATTERNS.SUPPORT.DASHBOARD_STATS)
  async getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  @MessagePattern(PATTERNS.SUPPORT.LIST_TICKETS)
  async listTickets(@Payload() query: TicketFilterDto) {
    return this.supportService.listTickets(query);
  }

  @MessagePattern(PATTERNS.SUPPORT.GET_TICKET)
  async getTicketDetails(@Payload() data: { id: string }) {
    return this.supportService.getTicketDetails(data.id);
  }

  @MessagePattern(PATTERNS.SUPPORT.CREATE_TICKET)
  async createTicket(@Payload() data: { staffId: string; dto: CreateTicketDto }) {
    return this.supportService.createTicket(data.staffId, data.dto);
  }

  @MessagePattern(PATTERNS.SUPPORT.REPLY_TICKET)
  async replyTicket(
    @Payload()
    data: {
      ticketId: string;
      senderId: string;
      senderName: string;
      senderRole: UserRole;
      dto: ReplyTicketDto;
    },
  ) {
    return this.supportService.replyTicket(
      data.ticketId,
      data.senderId,
      data.senderName,
      data.senderRole,
      data.dto,
    );
  }

  @MessagePattern(PATTERNS.SUPPORT.ASSIGN_TICKET)
  async assignTicket(@Payload() data: { ticketId: string; staffId: string; actorId: string }) {
    return this.supportService.assignTicket(data.ticketId, data.staffId, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.UPDATE_TICKET_STATUS)
  async updateTicketStatus(
    @Payload() data: { ticketId: string; dto: UpdateTicketStatusDto; actorId: string },
  ) {
    return this.supportService.updateTicketStatus(data.ticketId, data.dto, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.LIST_COMPLAINTS)
  async listComplaints(@Payload() query: ComplaintFilterDto) {
    return this.supportService.listComplaints(query);
  }

  @MessagePattern(PATTERNS.SUPPORT.GET_COMPLAINT)
  async getComplaintDetails(@Payload() data: { id: string }) {
    return this.supportService.getComplaintDetails(data.id);
  }

  @MessagePattern(PATTERNS.SUPPORT.UPDATE_COMPLAINT_STATUS)
  async updateComplaintStatus(
    @Payload() data: { complaintId: string; dto: UpdateComplaintStatusDto; actorId: string },
  ) {
    return this.supportService.updateComplaintStatus(data.complaintId, data.dto, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.ESCALATE_COMPLAINT)
  async escalateComplaint(
    @Payload() data: { complaintId: string; dto: EscalateComplaintDto; actorId: string },
  ) {
    return this.supportService.escalateComplaint(data.complaintId, data.dto, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.SEARCH_PATIENTS)
  async searchPatients(@Payload() query: SupportPatientSearchDto) {
    return this.supportService.searchPatients(query);
  }

  @MessagePattern(PATTERNS.SUPPORT.RESEND_NOTIFICATION)
  async resendPatientNotification(
    @Payload() data: { patientId: string; type: string; actorId: string },
  ) {
    return this.supportService.resendPatientNotification(data.patientId, data.type, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.LIST_FLAGGED_APPOINTMENTS)
  async listFlaggedAppointments() {
    return this.supportService.listFlaggedAppointments();
  }

  @MessagePattern(PATTERNS.SUPPORT.ASSIST_RESCHEDULE)
  async assistRescheduleAppointment(
    @Payload()
    data: {
      appointmentId: string;
      dto: AssistRescheduleAppointmentDto;
      actorId: string;
    },
  ) {
    return this.supportService.assistRescheduleAppointment(
      data.appointmentId,
      data.dto,
      data.actorId,
    );
  }

  @MessagePattern(PATTERNS.SUPPORT.CLEAR_APPOINTMENT_FLAG)
  async clearAppointmentFlag(@Payload() data: { appointmentId: string; actorId: string }) {
    return this.supportService.clearAppointmentFlag(data.appointmentId, data.actorId);
  }

  @MessagePattern(PATTERNS.SUPPORT.LIST_ACTIVITY_LOGS)
  async listActivityLogs(@Payload() query: SupportActivityFilterDto) {
    return this.supportService.listActivityLogs(query);
  }
}
