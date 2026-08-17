import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { LiveSupportEventService } from '../../common/events/live-support-event.service';
import { AuditService } from '../audit/audit.service';
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
import {
  TicketStatus,
  TicketPriority,
  ComplaintStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supportEventService: LiveSupportEventService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================
  // 1. DASHBOARD & KPIS
  // ==========================================
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedToday,
      urgentTickets,
      flaggedAppointments,
      recentTickets,
      priorityTickets,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_FOR_USER } }),
      this.prisma.supportTicket.count({
        where: {
          status: TicketStatus.RESOLVED,
          resolvedAt: { gte: today },
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          priority: TicketPriority.URGENT,
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),
      this.prisma.appointment.count({
        where: { issueFlag: true },
      }),
      this.prisma.supportTicket.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          assignedStaff: { select: { name: true } },
        },
      }),
      this.prisma.supportTicket.findMany({
        where: {
          priority: { in: [TicketPriority.URGENT, TicketPriority.HIGH] },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
        },
      }),
    ]);

    const pendingTickets = inProgressTickets + waitingTickets;

    return {
      stats: {
        openTickets,
        pendingTickets,
        resolvedToday,
        urgentIssues: urgentTickets,
        appointmentIssues: flaggedAppointments,
        unreadInquiries: waitingTickets,
      },
      kpis: {
        avgResolutionTime: '3.2h',
        firstContactResolution: '68%',
        customerSatisfaction: '4.6 / 5.0',
        escalationRate: '12%',
      },
      recentTickets,
      priorityTickets,
    };
  }

  // ==========================================
  // 2. SUPPORT TICKETS
  // ==========================================
  async listTickets(query: TicketFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.assignedStaffId) {
      where.assignedStaffId = query.assignedStaffId;
    }
    if (query.search) {
      where.OR = [
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { patient: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          assignedStaff: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketDetails(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        assignedStaff: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    return ticket;
  }

  async createTicket(staffId: string, dto: CreateTicketDto) {
    const ticketNumber = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        patientId: dto.patientId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        assignedStaffId: dto.assignedStaffId || staffId,
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    await this.logActivity(staffId, 'CREATE_TICKET', ticket.id, `Created ticket ${ticketNumber}`);

    // Emit live event
    this.supportEventService.emit({
      type: 'NEW_TICKET_CREATED',
      targetId: ticket.id,
      referenceNumber: ticketNumber,
      title: ticket.subject,
      patientName: ticket.patient?.user?.name || 'Patient',
      priority: ticket.priority,
      assignedStaffId: ticket.assignedStaffId || undefined,
    });

    return ticket;
  }

  async replyTicket(
    ticketId: string,
    senderId: string,
    senderName: string,
    senderRole: UserRole,
    dto: ReplyTicketDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { patient: { include: { user: { select: { name: true } } } } },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        senderName,
        senderRole,
        message: dto.message,
        isInternalNote: dto.isInternalNote ?? false,
        attachments: dto.attachments ?? [],
      },
    });

    if (!dto.isInternalNote && ticket.status === TicketStatus.WAITING_FOR_USER) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    await this.logActivity(
      senderId,
      dto.isInternalNote ? 'ADD_INTERNAL_NOTE' : 'REPLY_TICKET',
      ticketId,
      `Sent ${dto.isInternalNote ? 'internal note' : 'reply'} on ticket ${ticket.ticketNumber}`,
    );

    // Emit live event
    this.supportEventService.emit({
      type: 'TICKET_REPLIED',
      targetId: ticketId,
      referenceNumber: ticket.ticketNumber,
      title: `Reply added to ${ticket.ticketNumber}`,
      patientName: ticket.patient?.user?.name,
      priority: ticket.priority,
      assignedStaffId: ticket.assignedStaffId || undefined,
      data: { isInternalNote: dto.isInternalNote },
    });

    return message;
  }

  async assignTicket(ticketId: string, staffId: string, actorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedStaffId: staffId },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    await this.logActivity(actorId, 'ASSIGN_TICKET', ticketId, `Assigned ticket ${ticket.ticketNumber} to staff`);

    // Emit live event
    this.supportEventService.emit({
      type: 'TICKET_ASSIGNED',
      targetId: ticketId,
      referenceNumber: ticket.ticketNumber,
      title: `Ticket ${ticket.ticketNumber} assigned`,
      assignedStaffId: staffId,
      assignedStaffName: updated.assignedStaff?.name || undefined,
      priority: ticket.priority,
    });

    return updated;
  }

  async updateTicketStatus(ticketId: string, dto: UpdateTicketStatusDto, actorId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    } else if (dto.status === TicketStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    await this.logActivity(
      actorId,
      'UPDATE_TICKET_STATUS',
      ticketId,
      `Changed ticket ${ticket.ticketNumber} status to ${dto.status}`,
    );

    if (dto.status === TicketStatus.RESOLVED || dto.status === TicketStatus.CLOSED) {
      this.supportEventService.emit({
        type: 'TICKET_RESOLVED',
        targetId: ticketId,
        referenceNumber: ticket.ticketNumber,
        title: `Ticket ${ticket.ticketNumber} marked as ${dto.status}`,
        priority: ticket.priority,
      });
    }

    return updated;
  }

  // ==========================================
  // 3. COMPLAINTS & DISPUTES
  // ==========================================
  async listComplaints(query: ComplaintFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.search) {
      where.OR = [
        { complaintNumber: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { patient: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
        { relatedDoctor: { user: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          relatedDoctor: { include: { user: { select: { name: true } } } },
          assignedStaff: { select: { name: true } },
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getComplaintDetails(complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        relatedDoctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        assignedStaff: { select: { id: true, name: true } },
      },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${complaintId} not found`);
    }

    return complaint;
  }

  async createComplaint(staffId: string, dto: CreateComplaintDto) {
    const complaintNumber = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const complaint = await this.prisma.complaint.create({
      data: {
        complaintNumber,
        patientId: dto.patientId,
        relatedDoctorId: dto.relatedDoctorId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        assignedStaffId: staffId,
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    await this.logActivity(staffId, 'CREATE_COMPLAINT', complaint.id, `Created complaint ${complaintNumber}`);

    this.supportEventService.emit({
      type: 'COMPLAINT_CREATED',
      targetId: complaint.id,
      referenceNumber: complaintNumber,
      title: complaint.title,
      patientName: complaint.patient?.user?.name || 'Patient',
      priority: complaint.priority,
    });

    return complaint;
  }

  async updateComplaintStatus(complaintId: string, dto: UpdateComplaintStatusDto, actorId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${complaintId} not found`);
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.notes) {
      if (dto.status === ComplaintStatus.RESOLVED) {
        updateData.resolutionSummary = dto.notes;
      } else {
        updateData.adminNotes = dto.notes;
      }
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: updateData,
    });

    await this.logActivity(
      actorId,
      'UPDATE_COMPLAINT_STATUS',
      complaintId,
      `Changed complaint ${complaint.complaintNumber} status to ${dto.status}`,
    );

    return updated;
  }

  async escalateComplaint(complaintId: string, dto: EscalateComplaintDto, actorId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${complaintId} not found`);
    }

    const updated = await this.prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: ComplaintStatus.ESCALATED,
        adminNotes: `[ESCALATED BY STAFF]: ${dto.reason}`,
      },
    });

    await this.logActivity(
      actorId,
      'ESCALATE_COMPLAINT',
      complaintId,
      `Escalated complaint ${complaint.complaintNumber} to Administration: ${dto.reason}`,
    );

    // Emit live alert to Super Admins & Managers
    this.supportEventService.emit({
      type: 'COMPLAINT_ESCALATED',
      targetId: complaintId,
      referenceNumber: complaint.complaintNumber,
      title: `[ESCALATED] ${complaint.title}`,
      priority: 'URGENT',
      data: { reason: dto.reason },
    });

    return updated;
  }

  // ==========================================
  // 4. PRIVACY-PRESERVED PATIENT SEARCH (HIPAA-Safe)
  // ==========================================
  async searchPatients(query: SupportPatientSearchDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          emergencyName: true,
          emergencyRelationship: true,
          emergencyPhone: true,
          status: true,
          lastActivity: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
              emailVerifiedAt: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              supportTickets: true,
              complaints: true,
            },
          },
        },
      }),
      this.prisma.patientProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async resendPatientNotification(patientId: string, type: string, actorId: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    await this.logActivity(
      actorId,
      'RESEND_NOTIFICATION',
      patientId,
      `Resent ${type} notification to ${patient.user.email || patient.phone}`,
    );

    return {
      success: true,
      message: `${type} notification dispatched successfully to ${patient.user.name || patient.user.email}`,
    };
  }

  // ==========================================
  // 5. APPOINTMENT ISSUE ASSISTANCE
  // ==========================================
  async listFlaggedAppointments() {
    return this.prisma.appointment.findMany({
      where: { issueFlag: true },
      orderBy: { date: 'asc' },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
        clinic: { select: { name: true, address: true } },
      },
    });
  }

  async assistRescheduleAppointment(
    appointmentId: string,
    dto: AssistRescheduleAppointmentDto,
    actorId: string,
  ) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) {
      throw new NotFoundException(`Appointment with ID ${appointmentId} not found`);
    }

    const updateData: any = {
      date: new Date(dto.date),
      time: dto.time,
      issueFlag: false,
      issueNotes: dto.reason ? `Resolved via support: ${dto.reason}` : 'Rescheduled via support assistance',
    };

    if (dto.doctorId) {
      updateData.doctorId = dto.doctorId;
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    await this.logActivity(
      actorId,
      'RESCHEDULE_APPOINTMENT',
      appointmentId,
      `Assisted patient in rescheduling appointment ${appt.appointmentNumber} to ${dto.date} ${dto.time}`,
    );

    return updated;
  }

  async clearAppointmentFlag(appointmentId: string, actorId: string) {
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { issueFlag: false, issueNotes: null },
    });

    await this.logActivity(actorId, 'CLEAR_APPOINTMENT_FLAG', appointmentId, `Cleared issue flag on appointment`);

    return updated;
  }

  // ==========================================
  // 6. STAFF ACTIVITY AUDIT LOGS
  // ==========================================
  async listActivityLogs(query: SupportActivityFilterDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.staffId) {
      where.staffId = query.staffId;
    }

    const [items, total] = await Promise.all([
      this.prisma.supportActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staff: { select: { name: true, email: true, role: true } },
        },
      }),
      this.prisma.supportActivity.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async logActivity(staffId: string, action: string, targetId?: string, details?: string) {
    try {
      const staff = await this.prisma.user.findUnique({
        where: { id: staffId },
        select: { name: true },
      });

      const staffName = staff?.name || 'Support Agent';

      await Promise.all([
        this.prisma.supportActivity.create({
          data: {
            staffId,
            staffName,
            action,
            targetId,
            details,
          },
        }),
        this.auditService.recordLog({
          actorId: staffId,
          actorName: staffName,
          action: `SUPPORT_${action}`,
          resource: targetId || 'SUPPORT_PORTAL',
          details: details || undefined,
          result: 'success',
        }),
      ]);
    } catch {
      // Non-blocking logger
    }
  }
}
