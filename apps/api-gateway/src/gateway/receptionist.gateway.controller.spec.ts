import { Test, TestingModule } from '@nestjs/testing';
import { ReceptionistGatewayController } from './receptionist.gateway.controller';
import { AppointmentService } from '../../../appointment-service/src/appointment/appointment.service';
import { DoctorService } from '../../../doctor-service/src/doctor/doctor.service';
import { PatientService } from '../../../patient-service/src/patient/patient.service';
import { AuditService } from '../../../audit-service/src/audit/audit.service';
import { LiveQueueEventService } from '../../../../src/common/events/live-queue-event.service';
import { QueueStatus, UserRole } from '@medcare/contracts';

describe('ReceptionistGatewayController', () => {
  let controller: ReceptionistGatewayController;
  let appointmentService: any;
  let doctorService: any;
  let patientService: any;
  let auditService: any;
  let queueEventService: any;

  const mockUser = {
    id: 'rec-user-1',
    email: 'reception@medcare.local',
    role: UserRole.RECEPTIONIST,
  };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    appointmentService = {
      receptionistGetDashboardStats: jest.fn().mockResolvedValue({
        stats: { todayAppointments: 10, waitingPatients: 2 },
      }),
      listAppointments: jest.fn().mockResolvedValue({ data: [] }),
      reschedule: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      transitionStatus: jest
        .fn()
        .mockResolvedValue({ id: 'apt-1', status: 'CANCELLED' }),
      receptionistCheckIn: jest
        .fn()
        .mockResolvedValue({ id: 'q-1', queueNumber: 1 }),
      receptionistGetLiveQueue: jest.fn().mockResolvedValue([
        {
          id: 'q-1',
          queueNumber: 1,
          status: QueueStatus.WAITING,
          patient: { user: { name: 'John Doe' } },
          doctor: { user: { name: 'Dr. Patel' } },
          roomNumber: 'Room 101',
        },
      ]),
      receptionistUpdateQueueStatus: jest
        .fn()
        .mockResolvedValue({ id: 'q-1', status: QueueStatus.CALLED }),
      receptionistWalkInBooking: jest
        .fn()
        .mockResolvedValue({ id: 'q-2', queueNumber: 2 }),
    };

    doctorService = {
      receptionistGetDoctorStatusList: jest.fn().mockResolvedValue([]),
      receptionistGetScheduleGrid: jest
        .fn()
        .mockResolvedValue({ hours: [], schedules: [] }),
    };

    patientService = {
      receptionistSearchPatients: jest
        .fn()
        .mockResolvedValue({ data: [], meta: { total: 0 } }),
    };

    auditService = {
      listLogs: jest.fn().mockResolvedValue({ data: [] }),
    };

    queueEventService = {
      emit: jest.fn(),
      getStream: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReceptionistGatewayController],
      providers: [
        { provide: AppointmentService, useValue: appointmentService },
        { provide: DoctorService, useValue: doctorService },
        { provide: PatientService, useValue: patientService },
        { provide: AuditService, useValue: auditService },
        { provide: LiveQueueEventService, useValue: queueEventService },
      ],
    }).compile();

    controller = module.get<ReceptionistGatewayController>(
      ReceptionistGatewayController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get dashboard statistics', async () => {
    const res = await controller.getDashboard('clinic-1');
    expect(res).toBeDefined();
    expect(
      appointmentService.receptionistGetDashboardStats,
    ).toHaveBeenCalledWith('clinic-1');
  });

  it('should execute patient check-in', async () => {
    const res = await controller.checkInPatient(
      { appointmentId: 'apt-1', roomNumber: 'Room 101' },
      mockReq,
    );
    expect(res).toBeDefined();
    expect(appointmentService.receptionistCheckIn).toHaveBeenCalledWith(
      { appointmentId: 'apt-1', roomNumber: 'Room 101' },
      'rec-user-1',
    );
  });

  it('should update queue status', async () => {
    const res = await controller.updateQueueStatus(
      'q-1',
      { status: QueueStatus.CALLED },
      mockReq,
    );
    expect(res).toBeDefined();
    expect(
      appointmentService.receptionistUpdateQueueStatus,
    ).toHaveBeenCalledWith('q-1', QueueStatus.CALLED, 'rec-user-1');
  });

  it('should return display board for waiting lobby TV', async () => {
    const res = await controller.getDisplayBoard('clinic-1');
    expect(res).toBeDefined();
    expect(res.activeCount).toBe(1);
    expect(res.waitingList.length).toBe(1);
  });

  it('should get doctor schedule grid matrix', async () => {
    const res = await controller.getScheduleGrid('2026-08-16', 'clinic-1');
    expect(res).toBeDefined();
    expect(doctorService.receptionistGetScheduleGrid).toHaveBeenCalledWith(
      '2026-08-16',
      'clinic-1',
    );
  });

  it('should search patients directory', async () => {
    const res = await controller.searchPatients('rahim', '1', '10');
    expect(res).toBeDefined();
    expect(patientService.receptionistSearchPatients).toHaveBeenCalledWith(
      'rahim',
      1,
      10,
    );
  });
});
