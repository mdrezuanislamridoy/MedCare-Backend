import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountStatus,
  RecordCategory,
} from '@medcare/contracts';
import {
  PatientFilterDto,
  UpdatePatientProfileDto,
  CreateMedicalRecordDto,
} from './dto/patient.dto';

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async listPatients(filter: PatientFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.q) {
      where.OR = [
        { phone: { contains: filter.q, mode: 'insensitive' } },
        { address: { contains: filter.q, mode: 'insensitive' } },
        { user: { name: { contains: filter.q, mode: 'insensitive' } } },
        { user: { email: { contains: filter.q, mode: 'insensitive' } } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, createdAt: true },
          },
          _count: { select: { appointments: true, transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patientProfile.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientById(id: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, lastLoginAt: true },
        },
        appointments: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            clinic: { select: { name: true } },
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { appointments: true, transactions: true, reviews: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async updatePatientStatus(
    id: string,
    status: AccountStatus,
    reason?: string,
    actorId?: string,
  ) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updated = await this.prisma.patientProfile.update({
      where: { id },
      data: { status: status as any },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: `Patient Status Updated to ${status}`,
          resource: `Patient Profile ${id} (${patient.user.name || patient.user.email})`,
          details: reason ? JSON.stringify({ reason }) : undefined,
          result: 'success',
        },
      })
      .catch(() => null);

    return updated;
  }

  // --- Patient Portal Self-Service Methods ---

  private async ensurePatientProfile(userId: string) {
    let profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!profile) {
      profile = await this.prisma.patientProfile.create({
        data: { userId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return profile;
  }

  async getDashboardSummary(userId: string) {
    const patient = await this.ensurePatientProfile(userId);
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
      upcomingCount,
      todayAppt,
      totalVisits,
      completedVisits,
      pendingPaymentsCount,
      nextScheduled,
      recentPrescriptions,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          patientId: patient.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          date: { gte: startOfToday },
        },
      }),
      this.prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          date: { gte: startOfToday, lte: endOfToday },
          status: { in: ['IN_PROGRESS', 'CONFIRMED', 'CHECKED_IN'] },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          clinic: true,
        },
      }),
      this.prisma.appointment.count({
        where: { patientId: patient.id },
      }),
      this.prisma.appointment.count({
        where: { patientId: patient.id, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { patientId: patient.id, paymentStatus: 'PENDING' },
      }),
      this.prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          status: { in: ['CONFIRMED', 'PENDING'] },
          date: { gte: startOfToday },
        },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        include: {
          doctor: {
            include: {
              user: { select: { name: true, email: true } },
              clinic: true,
            },
          },
          clinic: true,
        },
      }),
      this.prisma.prescription.findMany({
        where: { patientId: patient.id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      patient: {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
      },
      stats: {
        upcoming: upcomingCount,
        today: todayAppt ? 1 : 0,
        total: totalVisits,
        completed: completedVisits,
        pendingPayments: pendingPaymentsCount,
      },
      nextVisit: nextScheduled,
      todayAppointment: todayAppt,
      recentPrescriptions,
    };
  }

  async getProfile(userId: string) {
    const profile = await this.ensurePatientProfile(userId);
    return profile;
  }

  async updateProfile(userId: string, data: UpdatePatientProfileDto) {
    const profile = await this.ensurePatientProfile(userId);

    const { name, dateOfBirth, ...patientFields } = data;

    if (name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const updated = await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        ...patientFields,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        emergencyContact:
          patientFields.emergencyContact || patientFields.emergencyPhone,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  }

  async listMedicalRecords(userId: string, category?: RecordCategory) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (category) {
      where.category = category;
    }

    return this.prisma.medicalRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    });
  }

  async createMedicalRecord(userId: string, data: CreateMedicalRecordDto) {
    const profile = await this.ensurePatientProfile(userId);
    return this.prisma.medicalRecord.create({
      data: {
        patientId: profile.id,
        title: data.title,
        category: data.category as any,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        recordDate: data.recordDate ? new Date(data.recordDate) : new Date(),
        notes: data.notes,
      },
    });
  }

  async deleteMedicalRecord(userId: string, recordId: string) {
    const profile = await this.ensurePatientProfile(userId);
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException(`Medical record not found`);
    }

    if (record.patientId !== profile.id) {
      throw new ForbiddenException(
        `You do not have permission to delete this record`,
      );
    }

    return this.prisma.medicalRecord.delete({
      where: { id: recordId },
    });
  }

  async listPrescriptions(userId: string) {
    const profile = await this.ensurePatientProfile(userId);
    return this.prisma.prescription.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
            clinic: true,
          },
        },
        appointment: {
          select: {
            appointmentNumber: true,
            date: true,
            time: true,
            type: true,
          },
        },
      },
    });
  }

  async getPrescriptionById(userId: string, prescriptionId: string) {
    const profile = await this.ensurePatientProfile(userId);
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
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
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.patientId !== profile.id) {
      throw new ForbiddenException('Access denied to this prescription');
    }

    return prescription;
  }

  // --- Receptionist Portal Methods ---

  async receptionistSearchPatients(q?: string, page = 1, limit = 10) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = {};
    if (q) {
      where.OR = [
        { phone: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          appointments: {
            take: 1,
            orderBy: { date: 'desc' },
            include: {
              doctor: { include: { user: { select: { name: true } } } },
            },
          },
          _count: { select: { appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patientProfile.count({ where }),
    ]);

    return {
      data: patients.map((p) => ({
        id: p.id,
        name: p.user.name || 'Unknown Patient',
        email: p.user.email,
        phone: p.phone || 'N/A',
        avatar: (p.user.name || 'P')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        doctor: p.appointments[0]?.doctor.user.name || 'General Physician',
        visits: p._count.appointments,
        lastVisit: p.appointments[0]?.date
          ? new Date(p.appointments[0].date).toISOString().split('T')[0]
          : 'None',
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
