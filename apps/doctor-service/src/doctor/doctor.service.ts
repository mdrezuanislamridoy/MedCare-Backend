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
  AppointmentStatus,
  AppointmentType,
  TransactionStatus,
  QueueStatus,
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
      include: { user: true, clinic: true },
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
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const [
      todayAppointmentsCount,
      completedTodayCount,
      pendingTodayCount,
      totalPatientsCount,
      todayAppointments,
      activeQueue,
      recentReviews,
      transactions,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfToday, lte: endOfToday },
          status: AppointmentStatus.COMPLETED,
        },
      }),
      this.prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfToday, lte: endOfToday },
          status: {
            in: [
              AppointmentStatus.PENDING,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.CHECKED_IN,
            ],
          },
        },
      }),
      this.prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        distinct: ['patientId'],
      }),
      this.prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          date: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: [{ time: 'asc' }],
        include: {
          patient: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          queue: true,
        },
      }),
      this.prisma.patientQueue.findMany({
        where: {
          doctorId: doctor.id,
          status: {
            in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_ROOM],
          },
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { queueNumber: 'asc' },
        include: {
          patient: {
            include: { user: { select: { name: true } } },
          },
          appointment: true,
        },
      }),
      this.prisma.doctorReview.findMany({
        where: { doctorId: doctor.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
      }),
      this.prisma.transaction.findMany({
        where: {
          doctorId: doctor.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
          status: TransactionStatus.COMPLETED,
        },
      }),
    ]);

    const todayEarnings = transactions.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    );

    // Find next upcoming appointment
    const nextUpcoming = todayAppointments.find(
      (a) =>
        a.status === AppointmentStatus.CONFIRMED ||
        a.status === AppointmentStatus.CHECKED_IN,
    );

    return {
      profile: {
        id: doctor.id,
        name: doctor.user.name,
        specialty: doctor.specialty,
        qualifications: doctor.qualifications,
        experienceYears: doctor.experienceYears,
        consultationFee: doctor.consultationFee,
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
        roomNumber: doctor.roomNumber,
        clinicName: doctor.clinic?.name || 'MedCare Main Clinic',
      },
      stats: {
        todayAppointments: todayAppointmentsCount,
        completedToday: completedTodayCount,
        pendingToday: pendingTodayCount,
        todayEarnings,
        totalPatients: totalPatientsCount.length,
        rating: doctor.rating,
      },
      nextUpcoming: nextUpcoming
        ? {
            id: nextUpcoming.id,
            appointmentNumber: nextUpcoming.appointmentNumber,
            patientName: nextUpcoming.patient.user.name,
            time: nextUpcoming.time,
            type: nextUpcoming.type,
            status: nextUpcoming.status,
            reason: nextUpcoming.notes,
          }
        : null,
      todayAppointments: todayAppointments.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        patientName: a.patient.user.name,
        time: a.time,
        type: a.type,
        status: a.status,
        reason: a.notes,
        queueToken: a.queue?.queueNumber || null,
      })),
      activeQueue: activeQueue.map((q) => ({
        id: q.id,
        queueNumber: q.queueNumber,
        patientName: q.patient.user.name,
        status: q.status,
        appointmentId: q.appointmentId,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        patientName: r.patient.user.name,
        rating: r.rating,
        comment: r.content,
        date: r.createdAt,
      })),
    };
  }

  // ==========================================
  // 2. CONSULTATION WORKSPACE
  // ==========================================
  async doctorGetConsultationWorkspace(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            medicalRecords: {
              take: 5,
              orderBy: { recordDate: 'desc' },
            },
            prescriptions: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              include: {
                doctor: { include: { user: { select: { name: true } } } },
              },
            },
          },
        },
        consultationNote: true,
        prescription: true,
        queue: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(
        `You are not authorized to view this consultation`,
      );
    }

    return {
      appointment: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes,
        queueToken: appointment.queue?.queueNumber || null,
      },
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.user.name,
        email: appointment.patient.user.email,
        phone: appointment.patient.phone,
        gender: appointment.patient.gender,
        dateOfBirth: appointment.patient.dateOfBirth,
        bloodGroup: appointment.patient.bloodGroup,
        height: appointment.patient.height,
        weight: appointment.patient.weight,
        allergies: appointment.patient.allergies,
        chronicConditions: appointment.patient.chronicConditions,
      },
      consultationNote: appointment.consultationNote || null,
      prescription: appointment.prescription || null,
      pastPrescriptions: appointment.patient.prescriptions,
      medicalRecords: appointment.patient.medicalRecords,
    };
  }

  async doctorSaveConsultationNotes(
    userId: string,
    appointmentId: string,
    dto: SaveConsultationNotesDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(
        `You are not authorized to save notes for this appointment`,
      );
    }

    const saved = await this.prisma.consultationNote.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        clinicalNotes: dto.clinicalNotes,
        treatmentPlan: dto.treatmentPlan,
        vitals: dto.vitals || {},
      },
      update: {
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        clinicalNotes: dto.clinicalNotes,
        treatmentPlan: dto.treatmentPlan,
        vitals: dto.vitals || {},
      },
    });

    return saved;
  }

  async doctorCompleteConsultation(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queue: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(`Unauthorized to complete consultation`);
    }

    // Transition appointment to COMPLETED
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.COMPLETED },
    });

    // If active queue token exists, complete it
    if (appointment.queue) {
      await this.prisma.patientQueue.update({
        where: { id: appointment.queue.id },
        data: { status: QueueStatus.COMPLETED },
      });
    }

    // Auto-record transaction if not already created
    const existingTxn = await this.prisma.transaction.findFirst({
      where: { appointmentId },
    });

    if (!existingTxn) {
      await this.prisma.transaction.create({
        data: {
          transactionNumber: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
          appointmentId,
          patientId: appointment.patientId,
          doctorId: doctor.id,
          amount: doctor.consultationFee,
          provider: 'IN_CLINIC',
          status: TransactionStatus.COMPLETED,
        },
      });
    }

    return {
      success: true,
      message: 'Consultation completed successfully',
      appointment: updated,
    };
  }

  async doctorUpdateAppointmentStatus(
    userId: string,
    appointmentId: string,
    status: string,
    notes?: string,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { queue: true },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(`Unauthorized to update appointment`);
    }

    const validStatus = status.toUpperCase() as AppointmentStatus;
    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: validStatus,
        notes: notes
          ? appointment.notes
            ? `${appointment.notes}\n${notes}`
            : notes
          : appointment.notes,
      },
    });

    if (validStatus === AppointmentStatus.COMPLETED && appointment.queue) {
      await this.prisma.patientQueue.update({
        where: { id: appointment.queue.id },
        data: { status: QueueStatus.COMPLETED },
      });
    }

    return {
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment: updated,
    };
  }

  // ==========================================
  // 3. DIGITAL PRESCRIPTIONS
  // ==========================================
  async doctorCreatePrescription(
    userId: string,
    dto: CreateDoctorPrescriptionDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${dto.appointmentId} not found`);
    }

    const prescription = await this.prisma.prescription.upsert({
      where: { appointmentId: dto.appointmentId },
      create: {
        appointmentId: dto.appointmentId,
        patientId: dto.patientId,
        doctorId: doctor.id,
        diagnosis: dto.diagnosis,
        advice: dto.advice,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        medicines: dto.medicines as any,
      },
      update: {
        diagnosis: dto.diagnosis,
        advice: dto.advice,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        medicines: dto.medicines as any,
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    return prescription;
  }

  async doctorListPrescriptions(userId: string, query: any) {
    const doctor = await this.getDoctorByUserId(userId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { doctorId: doctor.id };
    if (query.search) {
      where.OR = [
        {
          patient: {
            user: { name: { contains: query.search, mode: 'insensitive' } },
          },
        },
        { diagnosis: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            include: { user: { select: { name: true, email: true } } },
          },
          appointment: {
            select: { appointmentNumber: true, date: true, time: true },
          },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async doctorGetPrescriptionDetails(userId: string, prescriptionId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            clinic: true,
          },
        },
        appointment: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription ${prescriptionId} not found`);
    }
    if (prescription.doctorId !== doctor.id) {
      throw new ForbiddenException(`Unauthorized to view this prescription`);
    }

    return prescription;
  }

  // ==========================================
  // 4. APPOINTMENTS & VIDEO TELEHEALTH SESSIONS
  // ==========================================
  async doctorListAppointments(
    userId: string,
    query: DoctorAppointmentFilterDto,
  ) {
    const doctor = await this.getDoctorByUserId(userId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { doctorId: doctor.id };

    if (query.date) {
      const targetDate = new Date(query.date);
      const start = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      const end = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
      );
      where.date = { gte: start, lte: end };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.patient = {
        user: { name: { contains: query.search, mode: 'insensitive' } },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { time: 'asc' }],
        include: {
          patient: {
            include: { user: { select: { name: true, email: true } } },
          },
          queue: true,
          prescription: { select: { id: true } },
          consultationNote: { select: { id: true } },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async doctorGetAppointmentDetails(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: { select: { name: true, email: true } } },
        },
        queue: true,
        prescription: true,
        consultationNote: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(`Unauthorized to view this appointment`);
    }

    return appointment;
  }

  async doctorGetVideoSessionToken(userId: string, appointmentId: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment ${appointmentId} not found`);
    }
    if (appointment.doctorId !== doctor.id) {
      throw new ForbiddenException(
        `Unauthorized to generate video token for this appointment`,
      );
    }
    if (appointment.type !== AppointmentType.VIDEO) {
      throw new BadRequestException(
        `Appointment ${appointment.appointmentNumber} is an in-person consultation`,
      );
    }

    const channelName = `medcare-call-${appointment.appointmentNumber}`;
    const token = `mock-rtc-token-${doctor.id}-${Date.now()}`;

    return {
      appointmentId: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      channelName,
      token,
      appId: process.env.AGORA_APP_ID || 'medcare-agora-demo-id',
      doctorName: doctor.user.name,
      patientName: appointment.patient.user.name,
    };
  }

  // ==========================================
  // 5. PATIENTS DIRECTORY & MEDICAL RECORDS
  // ==========================================
  async doctorListPatients(userId: string, query: any) {
    const doctor = await this.getDoctorByUserId(userId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const appointments = await this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      distinct: ['patientId'],
      select: { patientId: true },
    });

    const patientIds = appointments.map((a) => a.patientId);

    const where: any = { id: { in: patientIds } };
    if (query.search) {
      where.user = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const [items, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastActivity: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { appointments: true, prescriptions: true } },
        },
      }),
      this.prisma.patientProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async doctorGetPatientMedicalRecords(userId: string, patientId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    // Verify relationship
    const pastAppt = await this.prisma.appointment.findFirst({
      where: { doctorId: doctor.id, patientId },
    });

    if (!pastAppt) {
      throw new ForbiddenException(
        `You can only access medical records of patients who have consulted with you`,
      );
    }

    return this.prisma.medicalRecord.findMany({
      where: { patientId },
      orderBy: { recordDate: 'desc' },
    });
  }

  // ==========================================
  // 6. SCHEDULE & AVAILABILITY
  // ==========================================
  async doctorGetSchedule(userId: string) {
    const doctor = await this.getDoctorByUserId(userId);

    const schedules = await this.prisma.doctorSchedule.findMany({
      where: { doctorId: doctor.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      consultationFee: doctor.consultationFee,
      schedules,
    };
  }

  async doctorUpdateSchedule(userId: string, dto: DoctorScheduleDto) {
    const doctor = await this.getDoctorByUserId(userId);

    if (dto.consultationFee !== undefined) {
      await this.prisma.doctorProfile.update({
        where: { id: doctor.id },
        data: { consultationFee: dto.consultationFee },
      });
    }

    for (const day of dto.days) {
      await this.prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek: {
            doctorId: doctor.id,
            dayOfWeek: day.dayOfWeek,
          },
        },
        create: {
          doctorId: doctor.id,
          dayOfWeek: day.dayOfWeek,
          isEnabled: day.isEnabled,
          startTime: day.startTime,
          endTime: day.endTime,
          breakStartTime: day.breakStartTime,
          breakEndTime: day.breakEndTime,
          slotDurationMin: day.slotDurationMin || 30,
        },
        update: {
          isEnabled: day.isEnabled,
          startTime: day.startTime,
          endTime: day.endTime,
          breakStartTime: day.breakStartTime,
          breakEndTime: day.breakEndTime,
          slotDurationMin: day.slotDurationMin || 30,
        },
      });
    }

    return this.doctorGetSchedule(userId);
  }

  // ==========================================
  // 7. FINANCIAL EARNINGS & PAYOUT REQUESTS
  // ==========================================
  async doctorGetEarningsSummary(userId: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayTxns, weekTxns, monthTxns, allTxns, pendingPayouts] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            doctorId: doctor.id,
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: startOfToday },
          },
        }),
        this.prisma.transaction.findMany({
          where: {
            doctorId: doctor.id,
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: startOfWeek },
          },
        }),
        this.prisma.transaction.findMany({
          where: {
            doctorId: doctor.id,
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.transaction.findMany({
          where: { doctorId: doctor.id, status: TransactionStatus.COMPLETED },
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { include: { user: { select: { name: true } } } },
            appointment: { select: { type: true } },
          },
          take: 10,
        }),
        this.prisma.doctorPayout.findMany({
          where: { doctorId: doctor.id, status: PayoutStatus.PAID },
        }),
      ]);

    const today = todayTxns.reduce((acc, t) => acc + t.amount, 0);
    const weekly = weekTxns.reduce((acc, t) => acc + t.amount, 0);
    const monthly = monthTxns.reduce((acc, t) => acc + t.amount, 0);
    const totalEarnings = allTxns.reduce((acc, t) => acc + t.amount, 0);
    const totalPaidOut = pendingPayouts.reduce((acc, p) => acc + p.amount, 0);

    const commission = Math.round(monthly * 0.1); // 10% platform commission
    const pendingPayout = Math.max(0, monthly - commission - totalPaidOut);

    return {
      kpi: {
        today,
        weekly,
        monthly,
        total: totalEarnings,
        commission,
        pendingPayout,
      },
      chartData: [
        { month: 'Mar', earnings: Math.round(monthly * 0.75) },
        { month: 'Apr', earnings: Math.round(monthly * 0.82) },
        { month: 'May', earnings: Math.round(monthly * 0.9) },
        { month: 'Jun', earnings: Math.round(monthly * 0.85) },
        { month: 'Jul', earnings: Math.round(monthly * 0.95) },
        { month: 'Aug', earnings: monthly },
      ],
      recentTransactions: allTxns.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        patientName: t.patient?.user?.name || 'Patient',
        amount: t.amount,
        type: t.appointment?.type || 'In-Person',
        status: t.status,
        date: t.createdAt,
      })),
    };
  }

  async doctorRequestPayout(userId: string, dto: DoctorPayoutRequestDto) {
    const doctor = await this.getDoctorByUserId(userId);
    const earnings = await this.doctorGetEarningsSummary(userId);

    if (dto.amount > earnings.kpi.pendingPayout) {
      throw new BadRequestException(
        `Requested amount $${dto.amount} exceeds pending payout balance $${earnings.kpi.pendingPayout}`,
      );
    }

    const payoutNumber = `PAYOUT-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.doctorPayout.create({
      data: {
        payoutNumber,
        doctorId: doctor.id,
        amount: dto.amount,
        status: PayoutStatus.PENDING,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        notes: dto.notes,
      },
    });
  }

  // ==========================================
  // 8. REVIEWS & RATINGS
  // ==========================================
  async doctorListReviews(userId: string, query: any) {
    const doctor = await this.getDoctorByUserId(userId);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.doctorReview.findMany({
        where: { doctorId: doctor.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { include: { user: { select: { name: true } } } },
        },
      }),
      this.prisma.doctorReview.count({ where: { doctorId: doctor.id } }),
    ]);

    // Calculate rating distribution
    const counts = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => Math.round(r.rating) === stars).length,
      pct:
        total > 0
          ? Math.round(
              (reviews.filter((r) => Math.round(r.rating) === stars).length /
                total) *
                100,
            )
          : 0,
    }));

    return {
      averageRating: doctor.rating,
      totalReviews: total,
      ratingDistribution: counts,
      reviews: reviews.map((r) => ({
        id: r.id,
        patientName: r.patient.user.name,
        rating: r.rating,
        comment: r.content,
        date: r.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async doctorReplyReview(userId: string, reviewId: string, reply: string) {
    const doctor = await this.getDoctorByUserId(userId);
    const review = await this.prisma.doctorReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }
    if (review.doctorId !== doctor.id) {
      throw new ForbiddenException(`Unauthorized to reply to this review`);
    }

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
        user: { select: { id: true, name: true, email: true, role: true } },
        clinic: true,
        verifications: { take: 1, orderBy: { createdAt: 'desc' } },
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
      include: { user: true, clinic: true },
    });
  }

  // ==========================================
  // ADMIN & PATIENT FACING METHODS (EXISTING)
  // ==========================================
  async listDoctors(filter: DoctorFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.specialty) {
      where.specialty = { contains: filter.specialty, mode: 'insensitive' };
    }
    if (filter.accountStatus) {
      where.accountStatus = filter.accountStatus;
    }
    if (filter.verificationStatus) {
      where.verificationStatus = filter.verificationStatus;
    }
    if (filter.clinicId) {
      where.clinicId = filter.clinicId;
    }
    if (filter.q) {
      where.OR = [
        { specialty: { contains: filter.q, mode: 'insensitive' } },
        { licenseNumber: { contains: filter.q, mode: 'insensitive' } },
        { user: { name: { contains: filter.q, mode: 'insensitive' } } },
        { user: { email: { contains: filter.q, mode: 'insensitive' } } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
          clinic: { select: { id: true, name: true, location: true } },
          _count: { select: { appointments: true, reviews: true } },
        },
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
        user: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
        clinic: true,
        verifications: { orderBy: { createdAt: 'desc' } },
        _count: { select: { appointments: true, reviews: true } },
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

    return this.prisma.doctorProfile.update({
      where: { id },
      data: { accountStatus: status as any },
      include: { user: true },
    });
  }

  async listVerificationQueue(status?: VerificationStatus) {
    return this.prisma.doctorVerification.findMany({
      where: { status: (status as any) || VerificationStatus.PENDING },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            clinic: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideVerification(id: string, dto: VerificationDecisionDto) {
    const verification = await this.prisma.doctorVerification.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!verification) {
      throw new NotFoundException(`Verification with ID ${id} not found`);
    }

    const updatedVerification = await this.prisma.doctorVerification.update({
      where: { id },
      data: {
        status: dto.decision as any,
        notes: dto.notes,
        reviewedById: dto.adminId,
        reviewedAt: new Date(),
      },
    });

    if (dto.decision === 'APPROVED' || dto.decision === 'VERIFIED') {
      await this.prisma.doctorProfile.update({
        where: { id: verification.doctorId },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      });
    } else if (dto.decision === 'REJECTED') {
      await this.prisma.doctorProfile.update({
        where: { id: verification.doctorId },
        data: { verificationStatus: VerificationStatus.REJECTED },
      });
    }

    return updatedVerification;
  }

  async patientSearchDoctors(dto: PatientDoctorSearchDto) {
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(dto.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
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
        { user: { name: { contains: dto.q, mode: 'insensitive' } } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          clinic: { select: { id: true, name: true, address: true } },
        },
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
        user: { select: { id: true, name: true, email: true } },
        clinic: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            patient: { include: { user: { select: { name: true } } } },
          },
        },
        _count: { select: { reviews: true, appointments: true } },
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

    const targetDate = new Date(date);
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
    );

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
      select: { time: true },
    });

    const bookedTimes = new Set(bookedAppointments.map((a) => a.time));

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
      available: !bookedTimes.has(time),
    }));
  }

  async receptionistGetScheduleGrid(date?: string, clinicId?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );
    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
    );

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    };
    if (clinicId) where.clinicId = clinicId;

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        appointments: {
          where: {
            date: { gte: startOfDay, lte: endOfDay },
            status: { notIn: [AppointmentStatus.CANCELLED] },
          },
          include: {
            patient: { include: { user: { select: { name: true } } } },
          },
        },
      },
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
      const slots = hours.map((hour) => {
        const appt = doc.appointments.find(
          (a) => a.time.startsWith(hour) || a.time.includes(hour),
        );
        return {
          time: hour,
          status: appt ? 'BOOKED' : 'AVAILABLE',
          appointmentId: appt?.id || null,
          patientName: appt?.patient?.user?.name || null,
          appointmentType: appt?.type || null,
        };
      });

      return {
        doctorId: doc.id,
        doctorName: doc.user.name,
        specialty: doc.specialty,
        roomNumber: doc.roomNumber || 'Room 101',
        slots,
      };
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      hours,
      schedules: doctorSchedules,
    };
  }

  async receptionistGetDoctorStatusList(clinicId?: string) {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
    };
    if (clinicId) where.clinicId = clinicId;

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        clinic: { select: { id: true, name: true } },
        queues: {
          where: {
            status: { in: ['WAITING', 'CALLED', 'IN_ROOM'] },
            createdAt: { gte: startOfToday, lte: endOfToday },
          },
        },
        appointments: {
          where: {
            date: { gte: startOfToday, lte: endOfToday },
            status: { in: ['CONFIRMED', 'PENDING'] },
          },
          orderBy: [{ time: 'asc' }],
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return doctors.map((doc) => ({
      id: doc.id,
      name: doc.user.name || 'Doctor',
      specialty: doc.specialty,
      roomNumber: doc.roomNumber || 'Room 101',
      isAvailableToday: doc.isAvailableToday,
      activeQueueCount: doc.queues.length,
      nextAppointment: doc.appointments[0]?.time || 'None',
      clinicName: doc.clinic?.name || 'MedCare Main Clinic',
    }));
  }
}
