import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { RecordCategory } from '../../../generated/prisma/client';

describe('PatientService', () => {
  let service: PatientService;
  let prisma: any;

  const mockPatientProfile = {
    id: 'pat-123',
    userId: 'user-123',
    phone: '01700000000',
    bloodGroup: 'A+',
    user: { id: 'user-123', name: 'John Doe', email: 'john@example.com' },
  };

  beforeEach(async () => {
    prisma = {
      patientProfile: {
        findUnique: jest.fn().mockResolvedValue(mockPatientProfile),
        create: jest.fn().mockResolvedValue(mockPatientProfile),
        update: jest.fn().mockResolvedValue({ ...mockPatientProfile, bloodGroup: 'B+' }),
        findMany: jest.fn().mockResolvedValue([mockPatientProfile]),
        count: jest.fn().mockResolvedValue(1),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(2),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      prescription: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      medicalRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'rec-1',
          patientId: 'pat-123',
          title: 'Blood Test',
          category: RecordCategory.LAB_REPORT,
          fileUrl: '/uploads/medical-records/test.pdf',
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'rec-1',
          patientId: 'pat-123',
        }),
        delete: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      },
      user: {
        update: jest.fn().mockResolvedValue({ id: 'user-123', name: 'John Updated' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return aggregated dashboard statistics for patient', async () => {
      const result = await service.getDashboardSummary('user-123');
      expect(result).toBeDefined();
      expect(result.patient.name).toBe('John Doe');
      expect(result.stats).toBeDefined();
      expect(result.stats.upcoming).toBe(2);
      expect(prisma.patientProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    });
  });

  describe('getProfile and updateProfile', () => {
    it('should retrieve patient profile', async () => {
      const profile = await service.getProfile('user-123');
      expect(profile.id).toBe('pat-123');
    });

    it('should update patient profile and user name', async () => {
      const result = await service.updateProfile('user-123', {
        name: 'John Updated',
        bloodGroup: 'B+',
      });
      expect(result.bloodGroup).toBe('B+');
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('medical records', () => {
    it('should create a medical record', async () => {
      const record = await service.createMedicalRecord('user-123', {
        title: 'Blood Test',
        category: RecordCategory.LAB_REPORT,
        fileUrl: '/uploads/medical-records/test.pdf',
      });
      expect(record.id).toBe('rec-1');
      expect(record.title).toBe('Blood Test');
    });

    it('should delete own medical record', async () => {
      const deleted = await service.deleteMedicalRecord('user-123', 'rec-1');
      expect(deleted.id).toBe('rec-1');
      expect(prisma.medicalRecord.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
    });
  });
});
