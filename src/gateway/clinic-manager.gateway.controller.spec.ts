import { Test, TestingModule } from '@nestjs/testing';
import { ClinicManagerGatewayController } from './clinic-manager.gateway.controller';
import { ClinicService } from '../microservices/clinic/clinic.service';
import { UserRole, StaffRole, RoomType } from '../../generated/prisma/client';

describe('ClinicManagerGatewayController', () => {
  let controller: ClinicManagerGatewayController;
  let clinicService: any;

  const mockUser = {
    id: 'mgr-1',
    email: 'manager@medcare.local',
    role: UserRole.CLINIC_MANAGER,
  };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    clinicService = {
      getClinicDashboardStats: jest
        .fn()
        .mockResolvedValue({ stats: { totalDoctors: 5 } }),
      getClinicProfile: jest.fn().mockResolvedValue({ id: 'clinic-1' }),
      updateClinicProfile: jest.fn().mockResolvedValue({ id: 'clinic-1' }),
      listClinicDoctors: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      assignDoctorToClinic: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      removeDoctorFromClinic: jest.fn().mockResolvedValue({ success: true }),
      listClinicStaff: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      createClinicStaff: jest.fn().mockResolvedValue({ id: 'staff-1' }),
      updateClinicStaff: jest.fn().mockResolvedValue({ id: 'staff-1' }),
      deleteClinicStaff: jest.fn().mockResolvedValue({ success: true }),
      listClinicRooms: jest.fn().mockResolvedValue([]),
      createClinicRoom: jest.fn().mockResolvedValue({ id: 'room-1' }),
      updateClinicRoom: jest.fn().mockResolvedValue({ id: 'room-1' }),
      deleteClinicRoom: jest.fn().mockResolvedValue({ success: true }),
      getClinicAppointments: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      getClinicQueue: jest.fn().mockResolvedValue([]),
      getClinicFinancialSummary: jest
        .fn()
        .mockResolvedValue({ totalRevenue: 15000 }),
      getClinicReports: jest.fn().mockResolvedValue({ metrics: {} }),
      getClinicActivityLogs: jest.fn().mockResolvedValue({ items: [] }),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicManagerGatewayController],
      providers: [{ provide: ClinicService, useValue: clinicService }],
    }).compile();

    controller = module.get<ClinicManagerGatewayController>(
      ClinicManagerGatewayController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dashboard stats and profile', async () => {
    const dash = await controller.getDashboard(mockReq);
    expect(dash).toBeDefined();
    expect(clinicService.getClinicDashboardStats).toHaveBeenCalledWith(
      'mgr-1',
      undefined,
    );

    const profile = await controller.getProfile(mockReq);
    expect(profile).toBeDefined();
  });

  it('should manage doctors, staff, and rooms', async () => {
    await controller.listDoctors(mockReq, {});
    expect(clinicService.listClinicDoctors).toHaveBeenCalled();

    await controller.createStaff(mockReq, {
      name: 'Amina',
      role: StaffRole.RECEPTIONIST,
    });
    expect(clinicService.createClinicStaff).toHaveBeenCalled();

    await controller.createRoom(mockReq, {
      roomNumber: '302',
      name: 'Cardiology',
      type: RoomType.CONSULTATION,
    });
    expect(clinicService.createClinicRoom).toHaveBeenCalled();
  });

  it('should get financials, reports, and queues', async () => {
    const fin = await controller.getPayments(mockReq, {});
    expect(fin).toBeDefined();

    const q = await controller.getQueue(mockReq);
    expect(q).toBeDefined();

    const rep = await controller.getReports(mockReq, {});
    expect(rep).toBeDefined();
  });
});
