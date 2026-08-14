import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { RedisService } from '../../common/cache/redis/redis.service';
import { AccountStatus, VerificationStatus } from '../../../generated/prisma/client';
import { DoctorFilterDto, VerificationDecisionDto } from './dto/doctor.dto';


@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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
          user: { select: { id: true, name: true, email: true, createdAt: true } },
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
        user: { select: { id: true, name: true, email: true, lastLoginAt: true } },
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

  async updateDoctorStatus(id: string, accountStatus: AccountStatus, reason?: string, actorId?: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    const updated = await this.prisma.doctorProfile.update({
      where: { id },
      data: { accountStatus },
    });

    if (accountStatus === AccountStatus.SUSPENDED && doctor.userId) {
      try {
        await this.redis.del(`user:session:${doctor.userId}`);
      } catch {
        // ignore redis token revocation error
      }
    }

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: `Doctor Status Updated to ${accountStatus}`,
        resource: `Doctor Profile ${id} (${doctor.user.name || doctor.user.email})`,
        details: reason ? JSON.stringify({ reason }) : undefined,
        result: 'success',
      },
    }).catch(() => null);

    return updated;
  }

  async listVerificationQueue(status?: VerificationStatus) {
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { in: [VerificationStatus.PENDING, VerificationStatus.DOCUMENTS_REQUESTED] };
    }

    return this.prisma.doctorVerification.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            clinic: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideVerification(id: string, input: VerificationDecisionDto) {
    const verification = await this.prisma.doctorVerification.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } } },
    });

    if (!verification) {
      throw new NotFoundException(`Verification item with ID ${id} not found`);
    }

    const updatedVerification = await this.prisma.doctorVerification.update({
      where: { id },
      data: {
        status: input.decision as VerificationStatus,
        notes: input.notes,
        reviewedById: input.adminId,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.doctorProfile.update({
      where: { id: verification.doctorId },
      data: {
        verificationStatus: input.decision as VerificationStatus,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: input.adminId,
        actorName: 'Admin',
        action: `Doctor Verification ${input.decision}`,
        resource: `Doctor ${verification.doctor.user.name || verification.doctor.user.email} (License: ${verification.license})`,
        details: JSON.stringify({ notes: input.notes, requestedDocuments: input.requestedDocuments }),
        result: 'success',
      },
    }).catch(() => null);

    return updatedVerification;
  }
}
