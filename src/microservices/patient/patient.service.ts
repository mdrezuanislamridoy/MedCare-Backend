import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { AccountStatus } from '../../../generated/prisma/client';
import { PatientFilterDto } from './dto/patient.dto';

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
          user: { select: { id: true, name: true, email: true, createdAt: true } },
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
        user: { select: { id: true, name: true, email: true, lastLoginAt: true } },
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
        _count: { select: { appointments: true, transactions: true, reviews: true } },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async updatePatientStatus(id: string, status: AccountStatus, reason?: string, actorId?: string) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    const updated = await this.prisma.patientProfile.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: `Patient Status Updated to ${status}`,
        resource: `Patient Profile ${id} (${patient.user.name || patient.user.email})`,
        details: reason ? JSON.stringify({ reason }) : undefined,
        result: 'success',
      },
    }).catch(() => null);

    return updated;
  }
}
