import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { LiveQueueEventService } from '../../common/events/live-queue-event.service';
import {
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
  QueueStatus,
} from '@medcare/contracts';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReceptionistAppointmentService', () => {
  let service: AppointmentService;
  let prisma: any;
  let eventService: any;

  const mockPatient = {
    id: 'pat-100',
    userId: 'user-100',
    user: { id: 'user-100', name: 'Rahim Ahmed', email: 'rahim@example.com' },
  };

  const mockDoctor = {
    id: 'doc-100',
    userId: 'doc-user-100',
    specialty: 'Internal Medicine',
    roomNumber: 'Room 204',
    user: {
      id: 'doc-user-100',
      name: 'Dr. Linda Cho',
      email: 'linda@medcare.local',
    },
  };

  const mockAppointment = {
    id: 'apt-100',
    appointmentNumber: 'APT-999-888',
    patientId: 'pat-100',
    doctorId: 'doc-100',
    clinicId: 'clinic-1',
    date: new Date(),
    time: '10:30 AM',
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    patient: mockPatient,
    doctor: mockDoctor,
    queue: null,
  };

  const mockQueueEntry = {
    id: 'q-100',
    queueNumber: 1,
    appointmentId: 'apt-100',
    doctorId: 'doc-100',
    patientId: 'pat-100',
    clinicId: 'clinic-1',
    roomNumber: 'Room 204',
    status: QueueStatus.WAITING,
    patient: mockPatient,
    doctor: mockDoctor,
    appointment: mockAppointment,
  };

  beforeEach(async () => {
    prisma = {
      appointment: {
        findUnique: jest.fn().mockResolvedValue(mockAppointment),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        count: jest.fn().mockResolvedValue(12),
        update: jest.fn().mockResolvedValue({
          ...mockAppointment,
          status: AppointmentStatus.CHECKED_IN,
        }),
        create: jest.fn().mockResolvedValue(mockAppointment),
      },
      patientQueue: {
        findFirst: jest.fn().mockResolvedValue(null), // no previous queue token today -> starts at 1
        create: jest.fn().mockResolvedValue(mockQueueEntry),
        findMany: jest.fn().mockResolvedValue([mockQueueEntry]),
        findUnique: jest.fn().mockResolvedValue(mockQueueEntry),
        update: jest
          .fn()
          .mockResolvedValue({ ...mockQueueEntry, status: QueueStatus.CALLED }),
        count: jest.fn().mockResolvedValue(3),
      },
      doctorProfile: {
        findUnique: jest.fn().mockResolvedValue(mockDoctor),
        count: jest.fn().mockResolvedValue(4),
      },
      patientProfile: {
        findUnique: jest.fn().mockResolvedValue(mockPatient),
        create: jest.fn().mockResolvedValue(mockPatient),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockPatient.user),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-100' }),
      },
    };

    eventService = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prisma },
        { provide: LiveQueueEventService, useValue: eventService },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  describe('receptionistGetDashboardStats', () => {
    it('should aggregate today KPI stats and timeline', async () => {
      const result = await service.receptionistGetDashboardStats('clinic-1');
      expect(result).toBeDefined();
      expect(result.stats.todayAppointments).toBe(12);
      expect(result.stats.waitingPatients).toBe(3);
      expect(result.timeline).toBeDefined();
      expect(result.liveQueue).toBeDefined();
    });
  });

  describe('receptionistCheckIn', () => {
    it('should assign token #1 and status WAITING for first patient of the day', async () => {
      const res = await service.receptionistCheckIn({
        appointmentId: 'apt-100',
        roomNumber: 'Room 204',
      });

      expect(res).toBeDefined();
      expect(prisma.patientQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 1,
            roomNumber: 'Room 204',
            status: QueueStatus.WAITING,
          }),
        }),
      );
      expect(eventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CHECKED_IN',
          queueNumber: 1,
        }),
      );
    });

    it('should assign token #2 if a queue token already exists today', async () => {
      prisma.patientQueue.findFirst.mockResolvedValueOnce({ queueNumber: 1 });

      await service.receptionistCheckIn({
        appointmentId: 'apt-100',
      });

      expect(prisma.patientQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queueNumber: 2,
          }),
        }),
      );
    });

    it('should return already checked in message if patient was already checked in', async () => {
      prisma.appointment.findUnique.mockResolvedValueOnce({
        ...mockAppointment,
        queue: mockQueueEntry,
      });

      const res = await service.receptionistCheckIn({
        appointmentId: 'apt-100',
      });

      expect(res).toEqual({
        message: 'Patient is already checked in',
        queue: mockQueueEntry,
      });
      expect(prisma.patientQueue.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if appointment is cancelled', async () => {
      prisma.appointment.findUnique.mockResolvedValueOnce({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      });

      await expect(
        service.receptionistCheckIn({ appointmentId: 'apt-100' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('receptionistUpdateQueueStatus', () => {
    it('should transition queue status to CALLED and emit real-time event', async () => {
      const res = await service.receptionistUpdateQueueStatus(
        'q-100',
        QueueStatus.CALLED,
      );
      expect(res).toBeDefined();
      expect(prisma.patientQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'q-100' },
          data: expect.objectContaining({ status: QueueStatus.CALLED }),
        }),
      );
      expect(eventService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: QueueStatus.CALLED,
          queueNumber: 1,
        }),
      );
    });

    it('should update appointment status to IN_PROGRESS when status is IN_ROOM', async () => {
      await service.receptionistUpdateQueueStatus('q-100', QueueStatus.IN_ROOM);
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: AppointmentStatus.IN_PROGRESS },
        }),
      );
    });

    it('should update appointment status to COMPLETED when status is COMPLETED', async () => {
      await service.receptionistUpdateQueueStatus(
        'q-100',
        QueueStatus.COMPLETED,
      );
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: AppointmentStatus.COMPLETED },
        }),
      );
    });
  });

  describe('receptionistWalkInBooking', () => {
    it('should create instant walk-in appointment and immediately check in patient', async () => {
      const res = await service.receptionistWalkInBooking({
        patientName: 'Kareem Abdul',
        phone: '+1-555-0199',
        doctorId: 'doc-100',
        roomNumber: 'Room 204',
      });

      expect(res).toBeDefined();
      expect(prisma.appointment.create).toHaveBeenCalled();
      expect(prisma.patientQueue.create).toHaveBeenCalled();
    });
  });
});
