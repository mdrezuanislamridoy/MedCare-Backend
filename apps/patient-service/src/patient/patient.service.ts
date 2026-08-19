import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, RecordCategory } from '@medcare/contracts';
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
        { name: { contains: filter.q, mode: 'insensitive' } },
        { email: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
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
        medicalRecords: true,
        prescriptions: true,
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
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updated = await this.prisma.patientProfile.update({
      where: { id },
      data: { status: status },
    });

    return updated;
  }

  // --- Patient Portal Self-Service Methods ---

  private async ensurePatientProfile(userId: string) {
    let profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.patientProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  async getDashboardSummary(userId: string) {
    const patient = await this.ensurePatientProfile(userId);

    const recentPrescriptions = await this.prisma.prescription.findMany({
      where: { patientId: patient.id },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return {
      patient: {
        id: patient.id,
        name: patient.name || 'Patient',
        email: patient.email,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
      },
      stats: {
        upcoming: 1,
        today: 0,
        total: 5,
        completed: 4,
        pendingPayments: 0,
      },
      nextVisit: null,
      todayAppointment: null,
      recentPrescriptions,
    };
  }

  async getProfile(userId: string) {
    const profile = await this.ensurePatientProfile(userId);
    return profile;
  }

  async updateProfile(userId: string, data: UpdatePatientProfileDto) {
    const profile = await this.ensurePatientProfile(userId);

    const {
      name,
      dateOfBirth,
      allergies,
      chronicConditions,
      emergencyContact,
      ...patientFields
    } = data;

    const updated = await this.prisma.patientProfile.update({
      where: { id: profile.id },
      data: {
        ...(name && { name }),
        ...patientFields,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        emergencyPhone: patientFields.emergencyPhone || emergencyContact,
        allergies: allergies
          ? Array.isArray(allergies)
            ? allergies
            : [allergies]
          : undefined,
        chronicConditions: chronicConditions
          ? Array.isArray(chronicConditions)
            ? chronicConditions
            : [chronicConditions]
          : undefined,
      },
    });

    return updated;
  }

  async listMedicalRecords(userId: string, category?: RecordCategory) {
    const profile = await this.ensurePatientProfile(userId);
    const where: any = { patientId: profile.id };
    if (category) {
      where.category = category as any;
    }

    return this.prisma.medicalRecord.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async createMedicalRecord(userId: string, data: CreateMedicalRecordDto) {
    const profile = await this.ensurePatientProfile(userId);
    return this.prisma.medicalRecord.create({
      data: {
        patientId: profile.id,
        title: data.title,
        category: (data.category as any) || RecordCategory.LAB_REPORT,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        description: data.notes,
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
    });
  }

  async getPrescriptionById(userId: string, prescriptionId: string) {
    const profile = await this.ensurePatientProfile(userId);
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
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
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await Promise.all([
      this.prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patientProfile.count({ where }),
    ]);

    return {
      data: patients.map((p) => ({
        id: p.id,
        name: p.name || 'Unknown Patient',
        email: p.email || 'N/A',
        phone: p.phone || 'N/A',
        avatar: (p.name || 'P')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        doctor: 'General Physician',
        visits: 1,
        lastVisit: 'None',
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
