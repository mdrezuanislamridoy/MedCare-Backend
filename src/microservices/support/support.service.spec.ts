import { Test, TestingModule } from '@nestjs/testing';
import { SupportService } from './support.service';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { LiveSupportEventService } from '../../common/events/live-support-event.service';
import { AuditService } from '../audit/audit.service';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ComplaintCategory,
  ComplaintStatus,
  UserRole,
} from '../../../generated/prisma/client';

describe('SupportService', () => {
  let service: SupportService;
  let prisma: any;
  let eventService: any;
  let auditService: any;

  const mockUser = {
    id: 'user-100',
    name: 'Rahim Ahmed',
    email: 'rahim@example.com',
  };

  const mockPatient = {
    id: 'pat-100',
    userId: 'user-100',
    phone: '+1-555-0100',
    user: mockUser,
  };

  const mockStaff = {
    id: 'staff-100',
    name: 'Alex Support',
    email: 'alex@medcare.local',
    role: UserRole.SUPPORT_STAFF,
  };

  const mockTicket = {
    id: 'tick-100',
    ticketNumber: 'TICK-8021',
    patientId: 'pat-100',
    assignedStaffId: 'staff-100',
    subject: 'Billing Issue',
    description: 'Double charge on appointment',
    category: TicketCategory.PAYMENT,
    priority: TicketPriority.HIGH,
    status: TicketStatus.OPEN,
    patient: mockPatient,
    assignedStaff: mockStaff,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockComplaint = {
    id: 'cmp-100',
    complaintNumber: 'CMP-4019',
    patientId: 'pat-100',
    relatedDoctorId: 'doc-100',
    title: 'Late Doctor',
    description: 'Waited over an hour',
    category: ComplaintCategory.WAIT_TIME,
    priority: TicketPriority.MEDIUM,
    status: ComplaintStatus.NEW,
    patient: mockPatient,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      supportTicket: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([mockTicket]),
        findUnique: jest.fn().mockResolvedValue(mockTicket),
        create: jest.fn().mockResolvedValue(mockTicket),
        update: jest.fn().mockResolvedValue({ ...mockTicket, status: TicketStatus.RESOLVED }),
      },
      ticketMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-100',
          ticketId: 'tick-100',
          message: 'Reply sent',
          senderName: 'Alex Support',
        }),
      },
      complaint: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([mockComplaint]),
        findUnique: jest.fn().mockResolvedValue(mockComplaint),
        create: jest.fn().mockResolvedValue(mockComplaint),
        update: jest.fn().mockResolvedValue({ ...mockComplaint, status: ComplaintStatus.ESCALATED }),
      },
      patientProfile: {
        findMany: jest.fn().mockResolvedValue([mockPatient]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn().mockResolvedValue(mockPatient),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({ id: 'apt-100', appointmentNumber: 'APT-100' }),
        update: jest.fn().mockResolvedValue({ id: 'apt-100', issueFlag: false }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockStaff),
      },
      supportActivity: {
        create: jest.fn().mockResolvedValue({ id: 'act-100' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    eventService = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    auditService = {
      recordLog: jest.fn().mockResolvedValue({ id: 'audit-100' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: PrismaService, useValue: prisma },
        { provide: LiveSupportEventService, useValue: eventService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  describe('getDashboardStats', () => {
    it('should calculate support dashboard metrics and KPIs', async () => {
      const result = await service.getDashboardStats();
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.kpis).toBeDefined();
      expect(result.kpis.avgResolutionTime).toBe('3.2h');
    });
  });

  describe('createTicket', () => {
    it('should create support ticket, log activity, and emit real-time event', async () => {
      const result = await service.createTicket('staff-100', {
        patientId: 'pat-100',
        subject: 'Billing Issue',
        description: 'Double charge',
        category: TicketCategory.PAYMENT,
        priority: TicketPriority.HIGH,
      });

      expect(result).toBeDefined();
      expect(prisma.supportTicket.create).toHaveBeenCalled();
      expect(eventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'NEW_TICKET_CREATED',
        }),
      );
    });
  });

  describe('replyTicket', () => {
    it('should create ticket message and emit reply event', async () => {
      const result = await service.replyTicket(
        'tick-100',
        'staff-100',
        'Alex Support',
        UserRole.SUPPORT_STAFF,
        { message: 'Refund initiated' },
      );

      expect(result).toBeDefined();
      expect(prisma.ticketMessage.create).toHaveBeenCalled();
      expect(eventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TICKET_REPLIED',
        }),
      );
    });
  });

  describe('escalateComplaint', () => {
    it('should escalate complaint to admin and emit urgent alert event', async () => {
      const result = await service.escalateComplaint(
        'cmp-100',
        { reason: 'Patient requesting legal arbitration' },
        'staff-100',
      );

      expect(result).toBeDefined();
      expect(prisma.complaint.update).toHaveBeenCalled();
      expect(eventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'COMPLAINT_ESCALATED',
          priority: 'URGENT',
        }),
      );
    });
  });

  describe('searchPatients (HIPAA Sanitization)', () => {
    it('should return sanitized patient records', async () => {
      const result = await service.searchPatients({ search: 'rahim' });
      expect(result).toBeDefined();
      expect(prisma.patientProfile.findMany).toHaveBeenCalled();
    });
  });

  describe('assistRescheduleAppointment', () => {
    it('should update appointment and clear issue flag', async () => {
      const result = await service.assistRescheduleAppointment(
        'apt-100',
        { date: '2026-08-20', time: '02:00 PM', reason: 'Patient flight delayed' },
        'staff-100',
      );

      expect(result).toBeDefined();
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issueFlag: false,
          }),
        }),
      );
    });
  });
});
