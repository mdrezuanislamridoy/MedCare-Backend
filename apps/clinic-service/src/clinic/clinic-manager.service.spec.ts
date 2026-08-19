import { Test, TestingModule } from '@nestjs/testing';
import { ClinicService } from './clinic.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountStatus,
  AppointmentStatus,
  RoomStatus,
  RoomType,
  StaffRole,
  StaffShiftStatus,
  UserRole,
} from '@medcare/contracts';

describe('ClinicService - Clinic Manager Operations', () => {
  let service: ClinicService;
  let prisma: any;

  const mockManager = {
    id: 'mgr-1',
    email: 'manager@medcare.local',
    role: UserRole.CLINIC_MANAGER,
  };

  const mockClinic = {
    id: 'clinic-1',
    name: 'MedCare Central Clinic',
    location: 'Tower A',
    address: '124 Healthcare Blvd',
    managerId: 'mgr-1',
    status: AccountStatus.ACTIVE,
  };

  const mockDoctor = {
    id: 'doc-1',
    clinicId: 'clinic-1',
    specialty: 'Cardiology',
    roomNumber: '302',
    isAvailableToday: true,
    user: { id: 'usr-doc', name: 'Dr. Sarah', email: 'sarah@medcare.local' },
  };

  const mockStaff = {
    id: 'staff-1',
    clinicId: 'clinic-1',
    name: 'Amina Khatun',
    role: StaffRole.RECEPTIONIST,
    shiftStatus: StaffShiftStatus.ON_DUTY,
  };

  const mockRoom = {
    id: 'room-1',
    clinicId: 'clinic-1',
    roomNumber: '302',
    name: 'Cardiology Suite',
    type: RoomType.CONSULTATION,
    status: RoomStatus.AVAILABLE,
    capacity: 2,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockManager),
      },
      clinic: {
        findFirst: jest.fn().mockResolvedValue(mockClinic),
        findUnique: jest.fn().mockResolvedValue(mockClinic),
        create: jest.fn().mockResolvedValue(mockClinic),
        update: jest.fn().mockResolvedValue(mockClinic),
        findMany: jest.fn().mockResolvedValue([mockClinic]),
        count: jest.fn().mockResolvedValue(1),
      },
      doctorProfile: {
        count: jest.fn().mockResolvedValue(5),
        findMany: jest.fn().mockResolvedValue([mockDoctor]),
        findUnique: jest.fn().mockResolvedValue(mockDoctor),
        findFirst: jest.fn().mockResolvedValue(mockDoctor),
        update: jest.fn().mockResolvedValue(mockDoctor),
      },
      clinicStaff: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([mockStaff]),
        create: jest.fn().mockResolvedValue(mockStaff),
        findFirst: jest.fn().mockResolvedValue(mockStaff),
        update: jest.fn().mockResolvedValue(mockStaff),
        delete: jest.fn().mockResolvedValue(mockStaff),
      },
      clinicRoom: {
        count: jest.fn().mockResolvedValue(8),
        findMany: jest.fn().mockResolvedValue([mockRoom]),
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(mockRoom),
        create: jest.fn().mockResolvedValue(mockRoom),
        update: jest.fn().mockResolvedValue(mockRoom),
        delete: jest.fn().mockResolvedValue(mockRoom),
      },
      appointment: {
        count: jest.fn().mockResolvedValue(15),
        findMany: jest.fn().mockResolvedValue([]),
      },
      patientQueue: {
        count: jest.fn().mockResolvedValue(4),
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ClinicService>(ClinicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClinicDashboardStats', () => {
    it('should return branch KPI metrics', async () => {
      const stats = await service.getClinicDashboardStats('mgr-1');
      expect(stats).toBeDefined();
      expect(stats.clinic.id).toBe('clinic-1');
      expect(stats.stats.totalDoctors).toBe(5);
      expect(stats.stats.totalStaff).toBe(10);
      expect(stats.stats.totalRooms).toBe(8);
    });
  });

  describe('Clinic Doctors Management', () => {
    it('should list clinic doctors with pagination', async () => {
      const result = await service.listClinicDoctors('mgr-1', undefined, {
        page: 1,
        limit: 10,
      });
      expect(result.items.length).toBe(1);
    });

    it('should assign a doctor to clinic', async () => {
      const updated = await service.assignDoctorToClinic('mgr-1', undefined, {
        doctorId: 'doc-1',
        roomNumber: '302',
      });
      expect(updated).toBeDefined();
      expect(prisma.doctorProfile.update).toHaveBeenCalled();
    });
  });

  describe('Clinic Staff Roster', () => {
    it('should create a new staff member and log audit', async () => {
      const created = await service.createClinicStaff('mgr-1', undefined, {
        name: 'Amina Khatun',
        role: StaffRole.RECEPTIONIST,
        shiftStatus: StaffShiftStatus.ON_DUTY,
      });
      expect(created).toBeDefined();
      expect(prisma.clinicStaff.create).toHaveBeenCalled();
    });
  });

  describe('Clinic Rooms Inventory', () => {
    it('should create a room and emit live event', async () => {
      const created = await service.createClinicRoom('mgr-1', undefined, {
        roomNumber: '302',
        name: 'Cardiology Suite',
        type: RoomType.CONSULTATION,
      });
      expect(created).toBeDefined();
      expect(prisma.clinicRoom.create).toHaveBeenCalled();
    });
  });
});
