import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountStatus,
  VerificationStatus,
  PayoutStatus,
} from '@medcare/contracts';
import {
  DoctorFilterDto,
  VerificationDecisionDto,
  PatientDoctorSearchDto,
  DoctorScheduleDto,
  SaveConsultationNotesDto,
  CreateDoctorPrescriptionDto,
  DoctorAppointmentFilterDto,
  DoctorPayoutRequestDto,
  UpdateDoctorProfileDto,
} from './dto/doctor.dto';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // HELPER: GET DOCTOR PROFILE BY USER ID
  // ==========================================
  private async getDoctorByUserId(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor profile not found for user ${userId}`,
      );
    }
    return doctor;
  }

  // ==========================================
  // 1. DOCTOR DASHBOARD & KPIS
  // ==========================================
  async doctorGetDashboard(userId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const payouts = await this.prisma.doctorPayout.findMany({
      where: { doctorId: doctor.id },
    });

    const totalEarnings = payouts
      .filter((p) => p.status === PayoutStatus.PROCESSED || p.status === PayoutStatus.PAID)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      profile: {
        id: doctor.id,
        name: doctor.name || 'Doctor',
        specialty: doctor.specialty,
        qualifications: doctor.qualifications,
        experienceYears: doctor.experienceYears,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
        roomNumber: doctor.roomNumber,
        clinicName: 'MedCare Main Clinic',
      },
      stats: {
        todayAppointments: 8,
        completedToday: 5,
        pendingToday: 3,
        todayEarnings: 250,
        totalEarnings,
        totalPatients: 42,
        rating: doctor.rating,
      },
    };
  }

  // ==========================================
  // 2. CONSULTATION WORKSPACE
  // ==========================================
  async doctorGetWorkspace(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const notes = await this.prisma.consultationNote.findUnique({
      where: { appointmentId },
    });

    return {
      appointmentId,
      doctorId: doctor.id,
      notes,
    };
  }

  async doctorSaveConsultationNotes(
    userId: string,
    appointmentId: string,
    dto: SaveConsultationNotesDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);

    const saved = await this.prisma.consultationNote.upsert({
      where: { appointmentId },
      create: {
        doctorId: doctor.id,
        patientId: dto.patientId || 'patient-1',
        appointmentId,
        symptoms: dto.symptoms || '',
        diagnosis: dto.diagnosis || '',
        treatmentPlan: dto.treatmentPlan || '',
        internalNotes: dto.internalNotes,
        vitals: dto.vitals as any,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
      update: {
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        treatmentPlan: dto.treatmentPlan,
        internalNotes: dto.internalNotes,
        vitals: dto.vitals as any,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
      },
    });

    return saved;
  }

  async doctorCompleteConsultation(
    userId: string,
    appointmentId: string,
    dto: SaveConsultationNotesDto,
  ) {
    return this.doctorSaveConsultationNotes(userId, appointmentId, dto);
  }

  // ==========================================
  // 3. PRESCRIPTIONS
  // ==========================================
  async doctorCreatePrescription(
    userId: string,
    appointmentId: string,
    dto: CreateDoctorPrescriptionDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    return {
      id: `rx-${Date.now()}`,
      appointmentId,
      doctorId: doctor.id,
      medicines: dto.medicines,
      instructions: dto.instructions,
      createdAt: new Date(),
    };
  }

  async doctorListPrescriptions(
    userId: string,
    filter: { page?: number; limit?: number; search?: string },
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    return {
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  async doctorGetPrescription(userId: string, id: string) {
    return { id, medicines: [] };
  }

  // ==========================================
  // 4. APPOINTMENTS
  // ==========================================
  async doctorListAppointments(
    userId: string,
    filter: DoctorAppointmentFilterDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    return {
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  async doctorGetAppointment(userId: string, id: string) {
    return { id, status: 'CONFIRMED' };
  }

  async doctorGetVideoToken(userId: string, appointmentId: string) {
    return {
      token: `tok_${Date.now()}`,
      room: `consult_${appointmentId}`,
    };
  }

  // ==========================================
  // 5. PATIENTS
  // ==========================================
  async doctorListPatients(
    userId: string,
    filter: { page?: number; limit?: number; search?: string },
  ) {
    return {
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  async doctorGetPatientRecords(userId: string, patientId: string) {
    return [];
  }

  // ==========================================
  // 6. SCHEDULE MANAGEMENT
  // ==========================================
  async doctorGetSchedule(userId: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      doctorId: doctor.id,
      isAvailableToday: doctor.isAvailableToday,
      schedules,
    };
  }

  async doctorUpdateSchedule(userId: string, dto: DoctorScheduleDto) {
    const doctor = await this.getDoctorByUserId(userId);

    if (dto.isAvailableToday !== undefined) {
      await this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { isAvailableToday: dto.isAvailableToday },
      });
    }

    if (dto.schedules && dto.schedules.length > 0) {
      for (const s of dto.schedules) {
        await this.prisma.doctorSchedule.upsert({
          where: {
            doctorId_dayOfWeek: {
              doctorId: doctor.id,
              dayOfWeek: s.dayOfWeek,
            },
          },
          create: {
            doctorId: doctor.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration || 30,
            isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
          },
          update: {
            startTime: s.startTime,
            endTime: s.endTime,
            slotDuration: s.slotDuration,
            isAvailable: s.isAvailable,
          },
        });
      }
    }

    return this.doctorGetSchedule(userId);
  }

  // ==========================================
  // 7. EARNINGS & PAYOUTS
  // ==========================================
  async doctorGetEarnings(userId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const payouts = await this.prisma.doctorPayout.findMany({
      where: { doctorId: doctor.id },
      orderBy: { requestedAt: 'desc' },
    });

    const totalEarned = payouts
      .filter((p) => p.status === PayoutStatus.PROCESSED || p.status === PayoutStatus.PAID)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      doctorId: doctor.id,
      consultationFee: doctor.consultationFee,
      totalEarned,
      availableBalance: 1250.0,
      pendingPayout: 350.0,
      payoutHistory: payouts,
    };
  }

  async doctorRequestPayout(userId: string, dto: DoctorPayoutRequestDto) {
    const doctor = await this.getDoctorByUserId(userId);

    return this.prisma.doctorPayout.create({
      data: {
        doctorId: doctor.id,
        amount: dto.amount,
        currency: 'USD',
        status: PayoutStatus.PENDING as any,
        payoutMethod: dto.payoutMethod || 'BANK_TRANSFER',
        accountDetails: dto.accountDetails as any,
      },
    });
  }

  // ==========================================
  // 8. REVIEWS & RATINGS
  // ==========================================
  async doctorListReviews(
    userId: string,
    filter: { page?: number; limit?: number },
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    return {
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        averageRating: doctor.rating,
      },
    };
  }

  async doctorReplyReview(userId: string, reviewId: string, reply: string) {
    return {
      success: true,
      message: 'Reply submitted successfully',
      reviewId,
      reply,
    };
  }

  // ==========================================
  // 9. DOCTOR PROFILE MANAGEMENT
  // ==========================================
  async doctorGetProfile(userId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        schedules: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor profile not found for user ${userId}`,
      );
    }

    return doctor;
  }

  async doctorUpdateProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const doctor = await this.getDoctorByUserId(userId);

    const updateData: any = {};
    if (dto.specialty) updateData.specialty = dto.specialty;
    if (dto.qualifications) updateData.qualifications = dto.qualifications;
    if (dto.experienceYears !== undefined)
      updateData.experienceYears = dto.experienceYears;
    if (dto.consultationFee !== undefined)
      updateData.consultationFee = dto.consultationFee;
    if (dto.roomNumber) updateData.roomNumber = dto.roomNumber;
    if (dto.bio) updateData.bio = dto.bio;
    if (dto.licenseNumber) updateData.licenseNumber = dto.licenseNumber;

    return this.prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: updateData,
    });
  }

  // ==========================================
  // ADMIN & PATIENT FACING METHODS
  // ==========================================
  async listDoctors(filter: DoctorFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.specialty) {
      where.specialty = { contains: filter.specialty, mode: 'insensitive' };
    }
    if (filter.verificationStatus) {
      where.verificationStatus = filter.verificationStatus as any;
    }
    if (filter.clinicId) {
      where.clinicId = filter.clinicId;
    }
    if (filter.q) {
      where.OR = [
        { specialty: { contains: filter.q, mode: 'insensitive' } },
        { licenseNumber: { contains: filter.q, mode: 'insensitive' } },
        { name: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      data: doctors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDoctorById(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        schedules: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async updateDoctorStatus(
    id: string,
    status: AccountStatus,
    reason?: string,
    actorId?: string,
  ) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async listVerificationQueue(status?: VerificationStatus) {
    return this.prisma.doctorProfile.findMany({
      where: { verificationStatus: (status as any) || VerificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideVerification(id: string, dto: VerificationDecisionDto) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const verificationStatus =
      dto.decision === 'APPROVED' || dto.decision === 'VERIFIED'
        ? VerificationStatus.VERIFIED
        : VerificationStatus.REJECTED;

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { verificationStatus: verificationStatus as any },
    });
  }

  async patientSearchDoctors(dto: PatientDoctorSearchDto) {
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      verificationStatus: VerificationStatus.VERIFIED as any,
    };

    if (dto.specialty) {
      where.specialty = { contains: dto.specialty, mode: 'insensitive' };
    }
    if (dto.clinicId) {
      where.clinicId = dto.clinicId;
    }
    if (dto.minRating) {
      where.rating = { gte: Number(dto.minRating) };
    }
    if (dto.q) {
      where.OR = [
        { specialty: { contains: dto.q, mode: 'insensitive' } },
        { name: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      data: doctors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async patientGetDoctorDetails(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        schedules: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async patientGetDoctorSlots(doctorId: string, date: string) {
    return this.patientGetAvailableSlots(doctorId, date);
  }

  async patientGetAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        schedules: true,
      },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const defaultSlots = [
      '09:00 AM',
      '09:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM',
      '02:00 PM',
      '02:30 PM',
      '03:00 PM',
      '03:30 PM',
      '04:00 PM',
      '04:30 PM',
    ];

    return defaultSlots.map((time) => ({
      time,
      available: true,
    }));
  }

  async receptionistGetScheduleGrid(date?: string, clinicId?: string) {
    const where: any = {
      verificationStatus: VerificationStatus.VERIFIED as any,
    };
    if (clinicId) where.clinicId = clinicId;

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const hours = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
    ];

    const doctorSchedules = doctors.map((doc) => {
      const slots = hours.map((hour) => ({
        time: hour,
        status: 'AVAILABLE',
        appointmentId: null,
        patientName: null,
        appointmentType: null,
      }));

      return {
        doctorId: doc.id,
        doctorName: doc.name || 'Doctor',
        specialty: doc.specialty,
        roomNumber: doc.roomNumber || 'Room 101',
        slots,
      };
    });

    return {
      date: date || new Date().toISOString().split('T')[0],
      hours,
      schedules: doctorSchedules,
    };
  }

  async receptionistGetDoctorStatusList(clinicId?: string) {
    const where: any = {
      verificationStatus: VerificationStatus.VERIFIED as any,
    };
    if (clinicId) where.clinicId = clinicId;

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    return doctors.map((doc) => ({
      id: doc.id,
      name: doc.name || 'Doctor',
      specialty: doc.specialty,
      roomNumber: doc.roomNumber || 'Room 101',
      isAvailableToday: doc.isAvailableToday,
      activeQueueCount: 0,
      nextAppointment: 'None',
      clinicName: 'MedCare Main Clinic',
    }));
  }
}
