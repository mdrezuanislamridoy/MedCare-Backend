import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { AppointmentFilterDto, RescheduleAppointmentDto, TransitionAppointmentStatusDto } from './dto/appointment.dto';
import { AppointmentStatus, PaymentStatus } from '../../../generated/prisma/client';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async listAppointments(filter: AppointmentFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }
    if (filter.type) {
      where.type = filter.type;
    }
    if (filter.doctorId) {
      where.doctorId = filter.doctorId;
    }
    if (filter.patientId) {
      where.patientId = filter.patientId;
    }
    if (filter.clinicId) {
      where.clinicId = filter.clinicId;
    }
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    if (filter.q) {
      where.OR = [
        { appointmentNumber: { contains: filter.q, mode: 'insensitive' } },
        { patient: { user: { name: { contains: filter.q, mode: 'insensitive' } } } },
        { doctor: { user: { name: { contains: filter.q, mode: 'insensitive' } } } },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          clinic: { select: { id: true, name: true, location: true } },
          transactions: { select: { id: true, amount: true, status: true, provider: true } },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAppointmentById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        clinic: true,
        transactions: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async transitionStatus(id: string, dto: TransitionAppointmentStatusDto, actorId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } } },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        cancellationReason: dto.cancellationReason || appointment.cancellationReason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: `Appointment ${appointment.appointmentNumber} status -> ${dto.status}`,
        resource: `Appointment ${appointment.appointmentNumber}`,
        details: dto.cancellationReason ? JSON.stringify({ cancellationReason: dto.cancellationReason }) : undefined,
        result: 'success',
      },
    }).catch(() => null);

    return updated;
  }

  async reschedule(id: string, dto: RescheduleAppointmentDto, actorId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot reschedule a ${appointment.status.toLowerCase()} appointment`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        date: new Date(dto.date),
        time: dto.time,
        ...(dto.doctorId && { doctorId: dto.doctorId }),
        ...(dto.clinicId && { clinicId: dto.clinicId }),
        status: AppointmentStatus.CONFIRMED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        actorName: 'Admin',
        action: `Appointment ${appointment.appointmentNumber} Rescheduled`,
        resource: `Appointment ${appointment.appointmentNumber}`,
        details: JSON.stringify(dto),
        result: 'success',
      },
    }).catch(() => null);

    return updated;
  }
}
