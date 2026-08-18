import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import {
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
} from '../../../generated/prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prisma: any;

  const mockPatient = { id: 'pat-123', userId: 'user-123' };
  const mockDoctor = {
    id: 'doc-123',
    userId: 'doc-user-1',
    specialty: 'Cardiology',
    clinicId: 'clinic-1',
  };
  const mockAppointment = {
    id: 'apt-1',
    appointmentNumber: 'APT-123456-789',
    patientId: 'pat-123',
    doctorId: 'doc-123',
    clinicId: 'clinic-1',
    date: new Date('2026-08-20'),
    time: '10:00 AM',
    type: AppointmentType.VIDEO,
    status: AppointmentStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    patient: {
      user: { id: 'user-123', name: 'John Doe', email: 'john@example.com' },
    },
    doctor: {
      user: { id: 'doc-user-1', name: 'Dr. Smith', email: 'smith@example.com' },
      specialty: 'Cardiology',
      clinic: { name: 'Cardio Care' },
    },
  };

  beforeEach(async () => {
    prisma = {
      patientProfile: {
        findUnique: jest.fn().mockResolvedValue(mockPatient),
        create: jest.fn().mockResolvedValue(mockPatient),
      },
      doctorProfile: {
        findUnique: jest.fn().mockResolvedValue(mockDoctor),
      },
      appointment: {
        findFirst: jest.fn().mockResolvedValue(null), // no collision by default
        create: jest.fn().mockResolvedValue(mockAppointment),
        findUnique: jest.fn().mockResolvedValue(mockAppointment),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue({
          ...mockAppointment,
          status: AppointmentStatus.CANCELLED,
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('patientBookAppointment', () => {
    it('should successfully book a new appointment when slot is free', async () => {
      const result = await service.patientBookAppointment('user-123', {
        doctorId: 'doc-123',
        date: '2026-08-20',
        time: '10:00 AM',
        type: AppointmentType.VIDEO,
      });

      expect(result).toBeDefined();
      expect(result.appointmentNumber).toBe('APT-123456-789');
      expect(prisma.appointment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slot is already taken', async () => {
      prisma.appointment.findFirst.mockResolvedValueOnce(mockAppointment);

      await expect(
        service.patientBookAppointment('user-123', {
          doctorId: 'doc-123',
          date: '2026-08-20',
          time: '10:00 AM',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('patientCancelAppointment', () => {
    it('should cancel active appointment', async () => {
      const result = await service.patientCancelAppointment(
        'user-123',
        'apt-1',
        'Personal reason',
      );
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(prisma.appointment.update).toHaveBeenCalled();
    });
  });

  describe('patientGetVideoSession', () => {
    it('should return video session roomId and token for video appointment', async () => {
      const session = await service.patientGetVideoSession('user-123', 'apt-1');
      expect(session).toBeDefined();
      expect(session.roomId).toBe('medcare-video-apt-1');
      expect(session.token).toBeDefined();
      expect(session.provider).toBe('WebRTC / Agora');
    });
  });
});
