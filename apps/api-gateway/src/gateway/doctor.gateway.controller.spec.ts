import { Test, TestingModule } from '@nestjs/testing';
import { DoctorGatewayController } from './doctor.gateway.controller';
import { DoctorService } from '../../../doctor-service/src/doctor/doctor.service';
import { LiveQueueEventService } from '../../../../src/common/events/live-queue-event.service';
import { UserRole } from '@medcare/contracts';

describe('DoctorGatewayController', () => {
  let controller: DoctorGatewayController;
  let doctorService: any;
  let queueEventService: any;

  const mockUser = {
    id: 'doc-user-1',
    email: 'doctor@medcare.local',
    role: UserRole.DOCTOR,
  };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    doctorService = {
      doctorGetDashboard: jest.fn().mockResolvedValue({
        stats: { todayAppointments: 6, completedToday: 2 },
      }),
      doctorGetConsultationWorkspace: jest.fn().mockResolvedValue({
        appointment: { id: 'apt-1' },
        patient: { name: 'James Harrington' },
      }),
      doctorSaveConsultationNotes: jest
        .fn()
        .mockResolvedValue({ id: 'note-1' }),
      doctorCompleteConsultation: jest
        .fn()
        .mockResolvedValue({ success: true }),
      doctorCreatePrescription: jest.fn().mockResolvedValue({ id: 'rx-1' }),
      doctorListPrescriptions: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      doctorGetPrescriptionDetails: jest.fn().mockResolvedValue({ id: 'rx-1' }),
      doctorListAppointments: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      doctorGetAppointmentDetails: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      doctorGetVideoSessionToken: jest.fn().mockResolvedValue({
        channelName: 'medcare-call-101',
        token: 'mock-tok',
      }),
      doctorListPatients: jest
        .fn()
        .mockResolvedValue({ items: [], meta: { total: 0 } }),
      doctorGetPatientMedicalRecords: jest.fn().mockResolvedValue([]),
      doctorGetSchedule: jest
        .fn()
        .mockResolvedValue({ consultationFee: 150, schedules: [] }),
      doctorUpdateSchedule: jest
        .fn()
        .mockResolvedValue({ consultationFee: 150, schedules: [] }),
      doctorGetEarningsSummary: jest
        .fn()
        .mockResolvedValue({ kpi: { today: 150 } }),
      doctorRequestPayout: jest.fn().mockResolvedValue({ id: 'payout-1' }),
      doctorListReviews: jest
        .fn()
        .mockResolvedValue({ reviews: [], meta: { total: 0 } }),
      doctorReplyReview: jest.fn().mockResolvedValue({ success: true }),
      doctorGetProfile: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      doctorUpdateProfile: jest.fn().mockResolvedValue({ id: 'doc-1' }),
    };

    queueEventService = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorGatewayController],
      providers: [
        { provide: DoctorService, useValue: doctorService },
        { provide: LiveQueueEventService, useValue: queueEventService },
      ],
    }).compile();

    controller = module.get<DoctorGatewayController>(DoctorGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get doctor dashboard', async () => {
    const res = await controller.getDashboard(mockReq);
    expect(res).toBeDefined();
    expect(doctorService.doctorGetDashboard).toHaveBeenCalledWith('doc-user-1');
  });

  it('should get consultation workspace', async () => {
    const res = await controller.getConsultationWorkspace(mockReq, 'apt-1');
    expect(res).toBeDefined();
    expect(doctorService.doctorGetConsultationWorkspace).toHaveBeenCalledWith(
      'doc-user-1',
      'apt-1',
    );
  });

  it('should save consultation notes', async () => {
    const res = await controller.saveConsultationNotes(mockReq, 'apt-1', {
      diagnosis: 'Hypertension',
    });
    expect(res).toBeDefined();
    expect(doctorService.doctorSaveConsultationNotes).toHaveBeenCalledWith(
      'doc-user-1',
      'apt-1',
      expect.anything(),
    );
  });

  it('should complete consultation', async () => {
    const res = await controller.completeConsultation(mockReq, 'apt-1');
    expect(res).toBeDefined();
    expect(doctorService.doctorCompleteConsultation).toHaveBeenCalledWith(
      'doc-user-1',
      'apt-1',
    );
  });

  it('should create digital prescription', async () => {
    const res = await controller.createPrescription(mockReq, {
      appointmentId: 'apt-1',
      patientId: 'pat-1',
      medicines: [],
    });
    expect(res).toBeDefined();
    expect(doctorService.doctorCreatePrescription).toHaveBeenCalledWith(
      'doc-user-1',
      expect.anything(),
    );
  });

  it('should get video session token', async () => {
    const res = await controller.getVideoSessionToken(mockReq, 'apt-1');
    expect(res).toBeDefined();
    expect(doctorService.doctorGetVideoSessionToken).toHaveBeenCalledWith(
      'doc-user-1',
      'apt-1',
    );
  });

  it('should get and update schedule', async () => {
    const schedule = await controller.getSchedule(mockReq);
    expect(schedule).toBeDefined();

    const updated = await controller.updateSchedule(mockReq, { days: [] });
    expect(updated).toBeDefined();
    expect(doctorService.doctorUpdateSchedule).toHaveBeenCalledWith(
      'doc-user-1',
      expect.anything(),
    );
  });

  it('should get earnings and request payout', async () => {
    const earnings = await controller.getEarnings(mockReq);
    expect(earnings).toBeDefined();

    const payout = await controller.requestPayout(mockReq, { amount: 500 });
    expect(payout).toBeDefined();
    expect(doctorService.doctorRequestPayout).toHaveBeenCalledWith(
      'doc-user-1',
      expect.anything(),
    );
  });
});
