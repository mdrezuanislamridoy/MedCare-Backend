import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import {
  AppointmentFilterDto,
  RescheduleAppointmentDto,
  TransitionAppointmentStatusDto,
  BookAppointmentDto,
  PatientAppointmentFilterDto,
} from './dto/appointment.dto';
import { AppointmentStatus, PaymentStatus, AppointmentType } from '../../../generated/prisma/client';

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
        prescription: true,
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

  // --- Patient Portal Methods ---

  private async getPatientIdFromUserId(userId: string): Promise<string> {
    let profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.patientProfile.create({
        data: { userId },
      });
    }
    return profile.id;
  }

  async patientListAppointments(userId: string, filter: PatientAppointmentFilterDto) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { patientId };

    if (filter.type) {
      where.type = filter.type;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter.tab === 'upcoming') {
      where.status = { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] };
      where.date = { gte: startOfToday };
    } else if (filter.tab === 'completed') {
      where.status = 'COMPLETED';
    } else if (filter.tab === 'cancelled') {
      where.status = { in: ['CANCELLED', 'NO_SHOW'] };
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              clinic: true,
            },
          },
          clinic: true,
          prescription: true,
          transactions: { select: { id: true, amount: true, status: true, provider: true } },
        },
        orderBy: { date: filter.tab === 'upcoming' ? 'asc' : 'desc' },
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

  async patientGetAppointment(userId: string, appointmentId: string) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            clinic: true,
          },
        },
        clinic: true,
        prescription: true,
        transactions: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Access denied to this appointment');
    }

    return appointment;
  }

  async patientBookAppointment(userId: string, dto: BookAppointmentDto) {
    const patientId = await this.getPatientIdFromUserId(userId);

    // Verify doctor exists
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor not found`);
    }

    const bookingDate = new Date(dto.date);

    // Check slot collision
    const existing = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        date: bookingDate,
        time: dto.time,
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
    });

    if (existing) {
      throw new BadRequestException('This slot has already been booked. Please choose another slot.');
    }

    const appointmentNumber = `APT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId,
        doctorId: dto.doctorId,
        clinicId: dto.clinicId || doctor.clinicId,
        date: bookingDate,
        time: dto.time,
        type: dto.type || AppointmentType.IN_PERSON,
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        notes: dto.notes,
      },
      include: {
        doctor: { include: { user: true } },
        clinic: true,
      },
    });

    return appointment;
  }

  async patientCancelAppointment(userId: string, appointmentId: string, reason?: string) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Access denied to this appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel a ${appointment.status.toLowerCase()} appointment`);
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by patient',
      },
    });
  }

  async patientRescheduleAppointment(userId: string, appointmentId: string, dto: RescheduleAppointmentDto) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('Access denied to this appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED || appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot reschedule a ${appointment.status.toLowerCase()} appointment`);
    }

    const targetDate = new Date(dto.date);

    // Slot collision check
    const existing = await this.prisma.appointment.findFirst({
      where: {
        doctorId: appointment.doctorId,
        date: targetDate,
        time: dto.time,
        id: { not: appointmentId },
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
    });

    if (existing) {
      throw new BadRequestException('This slot has already been booked. Please pick another slot.');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: targetDate,
        time: dto.time,
        status: AppointmentStatus.CONFIRMED,
      },
    });
  }
}
