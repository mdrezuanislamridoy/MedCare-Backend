import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { AccountStatus } from '../../../generated/prisma/client';
import { ClinicFilterDto, CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';

@Injectable()
export class ClinicService {
  constructor(private readonly prisma: PrismaService) {}

  async listClinics(filter: ClinicFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.q) {
      where.OR = [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { location: { contains: filter.q, mode: 'insensitive' } },
        { city: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [clinics, total] = await Promise.all([
      this.prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        include: {
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { doctors: true, appointments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clinic.count({ where }),
    ]);

    return {
      data: clinics,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getClinicById(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        doctors: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { doctors: true, appointments: true } },
      },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    return clinic;
  }

  async createClinic(data: CreateClinicDto, actorId?: string) {
    const clinic = await this.prisma.clinic.create({
      data: {
        name: data.name,
        location: data.location,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        managerId: data.managerId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: 'Clinic Created',
        resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
        details: JSON.stringify(data),
        result: 'success',
      },
    }).catch(() => null);

    return clinic;
  }

  async updateClinic(id: string, data: UpdateClinicDto, actorId?: string) {
    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.location && { location: data.location }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: 'Clinic Updated',
        resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
        details: JSON.stringify(data),
        result: 'success',
      },
    }).catch(() => null);

    return clinic;
  }

  async updateClinicStatus(id: string, status: AccountStatus, reason?: string, actorId?: string) {
    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: `Clinic Status Updated to ${status}`,
        resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
        details: reason ? JSON.stringify({ reason }) : undefined,
        result: 'success',
      },
    }).catch(() => null);

    return clinic;
  }
}
