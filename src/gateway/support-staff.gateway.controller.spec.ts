import { Test, TestingModule } from '@nestjs/testing';
import { SupportStaffGatewayController } from './support-staff.gateway.controller';
import { SupportService } from '../microservices/support/support.service';
import { LiveSupportEventService } from '../common/events/live-support-event.service';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  ComplaintCategory,
  ComplaintStatus,
  UserRole,
} from '../../generated/prisma/client';

describe('SupportStaffGatewayController', () => {
  let controller: SupportStaffGatewayController;
  let supportService: any;
  let eventService: any;

  const mockUser = {
    id: 'staff-1',
    email: 'support@medcare.local',
    role: UserRole.SUPPORT_STAFF,
  };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    supportService = {
      getDashboardStats: jest.fn().mockResolvedValue({
        stats: { openTickets: 4, pendingTickets: 2 },
        kpis: { avgResolutionTime: '3.2h' },
      }),
      listTickets: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      getTicketDetails: jest
        .fn()
        .mockResolvedValue({ id: 'tick-1', ticketNumber: 'TICK-101' }),
      createTicket: jest
        .fn()
        .mockResolvedValue({ id: 'tick-1', ticketNumber: 'TICK-101' }),
      replyTicket: jest
        .fn()
        .mockResolvedValue({ id: 'msg-1', message: 'Hello' }),
      assignTicket: jest
        .fn()
        .mockResolvedValue({ id: 'tick-1', assignedStaffId: 'staff-2' }),
      updateTicketStatus: jest
        .fn()
        .mockResolvedValue({ id: 'tick-1', status: TicketStatus.RESOLVED }),
      listComplaints: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      getComplaintDetails: jest
        .fn()
        .mockResolvedValue({ id: 'cmp-1', complaintNumber: 'CMP-101' }),
      createComplaint: jest
        .fn()
        .mockResolvedValue({ id: 'cmp-1', complaintNumber: 'CMP-101' }),
      updateComplaintStatus: jest
        .fn()
        .mockResolvedValue({ id: 'cmp-1', status: ComplaintStatus.RESOLVED }),
      escalateComplaint: jest
        .fn()
        .mockResolvedValue({ id: 'cmp-1', status: ComplaintStatus.ESCALATED }),
      searchPatients: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      resendPatientNotification: jest.fn().mockResolvedValue({ success: true }),
      listFlaggedAppointments: jest.fn().mockResolvedValue([]),
      assistRescheduleAppointment: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      clearAppointmentFlag: jest
        .fn()
        .mockResolvedValue({ id: 'apt-1', issueFlag: false }),
      listActivityLogs: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
    };

    eventService = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportStaffGatewayController],
      providers: [
        { provide: SupportService, useValue: supportService },
        { provide: LiveSupportEventService, useValue: eventService },
      ],
    }).compile();

    controller = module.get<SupportStaffGatewayController>(
      SupportStaffGatewayController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dashboard statistics', async () => {
    const res = await controller.getDashboardStats();
    expect(res).toBeDefined();
    expect(supportService.getDashboardStats).toHaveBeenCalled();
  });

  it('should list tickets', async () => {
    const res = await controller.listTickets({ status: TicketStatus.OPEN });
    expect(res).toBeDefined();
    expect(supportService.listTickets).toHaveBeenCalled();
  });

  it('should create ticket', async () => {
    const res = await controller.createTicket(mockReq, {
      patientId: 'pat-1',
      subject: 'Issue',
      description: 'Desc',
      category: TicketCategory.TECHNICAL,
      priority: TicketPriority.MEDIUM,
    });
    expect(res).toBeDefined();
    expect(supportService.createTicket).toHaveBeenCalledWith(
      'staff-1',
      expect.anything(),
    );
  });

  it('should reply to ticket', async () => {
    const res = await controller.replyTicket(mockReq, 'tick-1', {
      message: 'Help is here',
    });
    expect(res).toBeDefined();
    expect(supportService.replyTicket).toHaveBeenCalled();
  });

  it('should escalate complaint to admin', async () => {
    const res = await controller.escalateComplaint(mockReq, 'cmp-1', {
      reason: 'Severe incident',
    });
    expect(res).toBeDefined();
    expect(supportService.escalateComplaint).toHaveBeenCalledWith(
      'cmp-1',
      { reason: 'Severe incident' },
      'staff-1',
    );
  });

  it('should search patients', async () => {
    const res = await controller.searchPatients({ search: 'rahim' });
    expect(res).toBeDefined();
    expect(supportService.searchPatients).toHaveBeenCalled();
  });

  it('should assist reschedule appointment', async () => {
    const res = await controller.assistRescheduleAppointment(mockReq, 'apt-1', {
      date: '2026-08-22',
      time: '10:00 AM',
      reason: 'Doctor delay',
    });
    expect(res).toBeDefined();
    expect(supportService.assistRescheduleAppointment).toHaveBeenCalledWith(
      'apt-1',
      expect.anything(),
      'staff-1',
    );
  });
});
