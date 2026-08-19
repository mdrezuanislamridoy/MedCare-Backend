import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../common/cache/redis/redis.service';
import { AuditService } from '../audit/audit.service';
import {
  AppointmentStatus,
  AppointmentType,
  PaymentStatus,
  QueueStatus,
  TransactionStatus,
  UserRole,
} from '@medcare/contracts';

describe('DoctorService', () => {
  let service: DoctorService;
  let prisma: any;
  let redis: any;
  let auditService: any;

  const mockUser = {
    id: 'doc-user-1',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah@medcare.local',
    role: UserRole.DOCTOR,
  };

  const mockDoctor = {
    id: 'doc-1',
    userId: 'doc-user-1',
    specialty: 'Cardiologist',
    consultationFee: 150,
    experienceYears: 12,
    qualifications: ['MBBS', 'MD (Cardiology)'],
    rating: 4.8,
    reviewCount: 312,
    roomNumber: 'Room 204',
    user: mockUser,
    clinic: { id: 'clinic-1', name: 'Mitchell Cardiac Center' },
  };

  const mockPatient = {
    id: 'pat-1',
    userId: 'pat-user-1',
    phone: '+1-555-1111',
    bloodGroup: 'A+',
    user: {
      id: 'pat-user-1',
      name: 'James Harrington',
      email: 'james@email.com',
    },
    medicalRecords: [],
    prescriptions: [],
  };

  const mockAppointment = {
    id: 'apt-1',
    appointmentNumber: 'APT-1001',
    doctorId: 'doc-1',
    patientId: 'pat-1',
    date: new Date(),
    time: '09:00 AM',
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.CONFIRMED,
    patient: mockPatient,
    queue: { id: 'q-1', queueNumber: 1, status: QueueStatus.WAITING },
    consultationNote: null,
    prescription: null,
  };

  const mockVideoAppointment = {
    ...mockAppointment,
    id: 'apt-2',
    appointmentNumber: 'APT-1002',
    type: AppointmentType.VIDEO,
  };

  beforeEach(async () => {
    prisma = {
      doctorProfile: {
        findUnique: jest.fn().mockResolvedValue(mockDoctor),
        findMany: jest.fn().mockResolvedValue([mockDoctor]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(mockDoctor),
      },
      appointment: {
        findUnique: jest.fn().mockResolvedValue(mockAppointment),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        findFirst: jest.fn().mockResolvedValue(mockAppointment),
        count: jest.fn().mockResolvedValue(6),
        update: jest.fn().mockResolvedValue({
          ...mockAppointment,
          status: AppointmentStatus.COMPLETED,
        }),
      },
      patientQueue: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'q-1', status: QueueStatus.COMPLETED }),
      },
      consultationNote: {
        upsert: jest.fn().mockResolvedValue({
          id: 'note-1',
          appointmentId: 'apt-1',
          diagnosis: 'Hypertension',
        }),
      },
      prescription: {
        upsert: jest.fn().mockResolvedValue({
          id: 'rx-1',
          appointmentId: 'apt-1',
          medicines: [],
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue({
          id: 'rx-1',
          doctorId: 'doc-1',
          patient: mockPatient,
          doctor: mockDoctor,
        }),
      },
      transaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'txn-1',
            amount: 150,
            status: TransactionStatus.COMPLETED,
            patient: mockPatient,
            appointment: mockAppointment,
          },
        ]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'txn-1' }),
      },
      doctorPayout: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'payout-1', payoutNumber: 'PAYOUT-5012' }),
      },
      doctorReview: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'rev-1', doctorId: 'doc-1' }),
      },
      doctorSchedule: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({ id: 'sched-1' }),
      },
      patientProfile: {
        findMany: jest.fn().mockResolvedValue([mockPatient]),
        count: jest.fn().mockResolvedValue(1),
      },
      medicalRecord: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(null),
    };

    auditService = {
      recordLog: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  describe('doctorGetDashboard', () => {
    it('should aggregate today appointments, completed, pending, and earnings', async () => {
      const result = await service.doctorGetDashboard('doc-user-1');
      expect(result).toBeDefined();
      expect(result.stats).toBeDefined();
      expect(result.profile.name).toBe('Dr. Sarah Mitchell');
      expect(result.stats.todayEarnings).toBe(150);
    });
  });

  describe('doctorGetConsultationWorkspace', () => {
    it('should return patient clinical summary and consultation details', async () => {
      const result = await service.doctorGetConsultationWorkspace(
        'doc-user-1',
        'apt-1',
      );
      expect(result).toBeDefined();
      expect(result.patient.name).toBe('James Harrington');
      expect(result.patient.bloodGroup).toBe('A+');
    });
  });

  describe('doctorSaveConsultationNotes', () => {
    it('should upsert clinical consultation note and log audit trail', async () => {
      const result = await service.doctorSaveConsultationNotes(
        'doc-user-1',
        'apt-1',
        {
          diagnosis: 'Hypertension',
          treatmentPlan: 'Prescribed ACE inhibitors',
          vitals: { bp: '130/80', pulse: 72 },
        },
      );

      expect(result).toBeDefined();
      expect(prisma.consultationNote.upsert).toHaveBeenCalled();
      expect(auditService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DOCTOR_SAVE_CONSULTATION_NOTES',
        }),
      );
    });
  });

  describe('doctorCompleteConsultation', () => {
    it('should complete appointment, update queue, and auto-record fee transaction', async () => {
      const result = await service.doctorCompleteConsultation(
        'doc-user-1',
        'apt-1',
      );
      expect(result.success).toBe(true);
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'apt-1' },
          data: { status: AppointmentStatus.COMPLETED },
        }),
      );
      expect(prisma.patientQueue.update).toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalled();
    });
  });

  describe('doctorCreatePrescription', () => {
    it('should create digital prescription with medicines and log audit record', async () => {
      const result = await service.doctorCreatePrescription('doc-user-1', {
        appointmentId: 'apt-1',
        patientId: 'pat-1',
        diagnosis: 'Hypertension',
        advice: 'Low sodium diet',
        medicines: [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '90 days',
            instructions: 'Morning',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(prisma.prescription.upsert).toHaveBeenCalled();
      expect(auditService.recordLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DOCTOR_ISSUE_PRESCRIPTION',
        }),
      );
    });
  });

  describe('doctorGetVideoSessionToken', () => {
    it('should generate secure video room and token for teleconsultation', async () => {
      prisma.appointment.findUnique.mockResolvedValueOnce(mockVideoAppointment);

      const result = await service.doctorGetVideoSessionToken(
        'doc-user-1',
        'apt-2',
      );
      expect(result).toBeDefined();
      expect(result.channelName).toBe('medcare-call-APT-1002');
      expect(result.token).toBeDefined();
      expect(result.doctorName).toBe('Dr. Sarah Mitchell');
    });
  });

  describe('doctorUpdateSchedule', () => {
    it('should update doctor weekly working roster and consultation fee', async () => {
      const result = await service.doctorUpdateSchedule('doc-user-1', {
        consultationFee: 175,
        days: [
          {
            dayOfWeek: 'Monday',
            isEnabled: true,
            startTime: '09:00',
            endTime: '17:00',
            slotDurationMin: 30,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(prisma.doctorProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { consultationFee: 175 },
        }),
      );
      expect(prisma.doctorSchedule.upsert).toHaveBeenCalled();
    });
  });

  describe('doctorGetEarningsSummary & doctorRequestPayout', () => {
    it('should calculate earnings and allow valid payout withdrawal', async () => {
      const earnings = await service.doctorGetEarningsSummary('doc-user-1');
      expect(earnings).toBeDefined();
      expect(earnings.kpi).toBeDefined();

      const payout = await service.doctorRequestPayout('doc-user-1', {
        amount: 50,
        bankName: 'Chase Bank',
      });
      expect(payout).toBeDefined();
      expect(prisma.doctorPayout.create).toHaveBeenCalled();
    });
  });
});
