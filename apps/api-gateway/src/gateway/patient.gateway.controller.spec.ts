import { Test, TestingModule } from '@nestjs/testing';
import { PatientGatewayController } from './patient.gateway.controller';
import { PatientService } from '../microservices/patient/patient.service';
import { AppointmentService } from '../microservices/appointment/appointment.service';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { FinanceService } from '../microservices/finance/finance.service';
import { ReviewService } from '../microservices/review/review.service';
import { NotificationService } from '../microservices/notification/notification.service';
import { UserRole } from '@medcare/contracts';

describe('PatientGatewayController', () => {
  let controller: PatientGatewayController;
  let patientService: any;
  let appointmentService: any;

  const mockUser = {
    id: 'user-123',
    email: 'patient@example.com',
    role: UserRole.PATIENT,
  };
  const mockReq = { user: mockUser } as any;

  beforeEach(async () => {
    patientService = {
      getDashboardSummary: jest
        .fn()
        .mockResolvedValue({ stats: { upcoming: 1 } }),
      getProfile: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      updateProfile: jest.fn().mockResolvedValue({ id: 'pat-1' }),
      listMedicalRecords: jest.fn().mockResolvedValue([]),
      createMedicalRecord: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      deleteMedicalRecord: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      listPrescriptions: jest.fn().mockResolvedValue([]),
      getPrescriptionById: jest.fn().mockResolvedValue({ id: 'pres-1' }),
    };

    appointmentService = {
      patientListAppointments: jest.fn().mockResolvedValue({ data: [] }),
      patientGetAppointment: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      patientBookAppointment: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      patientCancelAppointment: jest.fn().mockResolvedValue({ id: 'apt-1' }),
      patientRescheduleAppointment: jest
        .fn()
        .mockResolvedValue({ id: 'apt-1' }),
      patientGetVideoSession: jest
        .fn()
        .mockResolvedValue({ roomId: 'medcare-video-apt-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientGatewayController],
      providers: [
        { provide: PatientService, useValue: patientService },
        { provide: AppointmentService, useValue: appointmentService },
        {
          provide: DoctorService,
          useValue: {
            patientSearchDoctors: jest.fn(),
            patientGetDoctorDetails: jest.fn(),
            patientGetDoctorSlots: jest.fn(),
          },
        },
        {
          provide: FinanceService,
          useValue: {
            patientGetSummary: jest.fn(),
            patientListInvoices: jest.fn(),
            patientPayAppointment: jest.fn(),
            createCheckoutSession: jest.fn(),
          },
        },
        {
          provide: ReviewService,
          useValue: {
            patientListPendingReviews: jest.fn(),
            patientSubmitReview: jest.fn(),
            patientListMyReviews: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            patientListNotifications: jest.fn(),
            patientMarkRead: jest.fn(),
            patientMarkAllRead: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PatientGatewayController>(PatientGatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getDashboardSummary with current user id', async () => {
    const res = await controller.getDashboardSummary(mockReq);
    expect(res).toBeDefined();
    expect(patientService.getDashboardSummary).toHaveBeenCalledWith('user-123');
  });

  it('should call getVideoSession for appointment', async () => {
    const session = await controller.getVideoSession(mockReq, 'apt-1');
    expect(session.roomId).toBe('medcare-video-apt-1');
    expect(appointmentService.patientGetVideoSession).toHaveBeenCalledWith(
      'user-123',
      'apt-1',
    );
  });
});
