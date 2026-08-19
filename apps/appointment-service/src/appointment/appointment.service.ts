import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AppointmentFilterDto,
  RescheduleAppointmentDto,
  TransitionAppointmentStatusDto,
  BookAppointmentDto,
  PatientAppointmentFilterDto,
  ReceptionistCheckInDto,
  ReceptionistUpdateQueueDto,
  ReceptionistWalkInBookingDto,
} from './dto/appointment.dto';
import {
  AppointmentStatus,
  AppointmentType,
  QueueStatus,
} from '@medcare/contracts';

@Injectable()
export class AppointmentService {
  constructor(private readonly prisma: PrismaService) {}

  async listAppointments(filter: AppointmentFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status as any;
    }
    if (filter.type) {
      where.type = filter.type as any;
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
        { patientName: { contains: filter.q, mode: 'insensitive' } },
        { doctorName: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          queue: true,
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
        queue: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async transitionStatus(
    id: string,
    dto: TransitionAppointmentStatusDto,
    actorId?: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status as any,
        notes: dto.cancellationReason || appointment.notes,
      },
    });

    return updated;
  }

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
    actorId?: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    if (
      appointment.status === (AppointmentStatus.COMPLETED as any) ||
      appointment.status === (AppointmentStatus.CANCELLED as any)
    ) {
      throw new BadRequestException(
        `Cannot reschedule a ${appointment.status.toLowerCase()} appointment`,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        date: new Date(dto.date),
        time: dto.time,
        ...(dto.doctorId && { doctorId: dto.doctorId }),
        ...(dto.clinicId && { clinicId: dto.clinicId }),
        status: AppointmentStatus.CONFIRMED as any,
      },
    });

    return updated;
  }

  // --- Patient Portal Methods ---

  async patientListAppointments(
    userId: string,
    filter: PatientAppointmentFilterDto,
  ) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { patientId: userId };

    if (filter.type) {
      where.type = filter.type as any;
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (filter.tab === 'upcoming') {
      where.status = {
        in: ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'],
      };
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
          queue: true,
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
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        queue: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async patientBookAppointment(userId: string, dto: BookAppointmentDto) {
    const bookingDate = new Date(dto.date);

    const appointmentNumber = `APT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId: userId,
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        date: bookingDate,
        time: dto.time,
        type: (dto.type as any) || AppointmentType.IN_PERSON,
        status: AppointmentStatus.CONFIRMED as any,
        isPaid: false,
        notes: dto.notes,
      },
    });

    return appointment;
  }

  async patientCancelAppointment(
    userId: string,
    appointmentId: string,
    reason?: string,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED as any,
        flagReason: reason || 'Cancelled by patient',
      },
    });
  }

  async patientRescheduleAppointment(
    userId: string,
    appointmentId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const targetDate = new Date(dto.date);

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        date: targetDate,
        time: dto.time,
        status: AppointmentStatus.CONFIRMED as any,
      },
    });
  }

  async patientGetVideoSession(userId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const roomId = `medcare-video-${appointment.id}`;
    const token = Buffer.from(
      JSON.stringify({
        roomId,
        userId,
        userName: appointment.patientName || 'Patient',
        role: 'patient',
        appointmentId: appointment.id,
        issuedAt: Date.now(),
        expiresIn: 3600 * 2,
      }),
    ).toString('base64');

    return {
      roomId,
      roomName: `Consultation Room ${appointment.appointmentNumber}`,
      token,
      provider: 'WebRTC / Agora',
      type: appointment.type,
      status: appointment.status,
      appointment: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        date: appointment.date,
        time: appointment.time,
        doctorName: appointment.doctorName || 'Doctor',
        clinicName: appointment.clinicName || 'MedCare Main Clinic',
      },
    };
  }

  // --- Receptionist Portal Methods ---

  async receptionistGetDashboardStats(clinicId?: string) {
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
      599,
    );

    const baseWhere: any = {
      date: { gte: startOfToday, lte: endOfToday },
    };
    if (clinicId) baseWhere.clinicId = clinicId;

    const [
      todayTotal,
      waitingCount,
      checkedInCount,
      completedCount,
      cancelledCount,
      todayTimeline,
      activeQueue,
    ] = await Promise.all([
      this.prisma.appointment.count({ where: baseWhere }),
      this.prisma.patientQueue.count({
        where: {
          status: 'WAITING',
          createdAt: { gte: startOfToday, lte: endOfToday },
          ...(clinicId && { clinicId }),
        },
      }),
      this.prisma.patientQueue.count({
        where: {
          status: { in: ['IN_ROOM', 'CALLED'] },
          createdAt: { gte: startOfToday, lte: endOfToday },
          ...(clinicId && { clinicId }),
        },
      }),
      this.prisma.appointment.count({
        where: { ...baseWhere, status: 'COMPLETED' },
      }),
      this.prisma.appointment.count({
        where: { ...baseWhere, status: { in: ['CANCELLED', 'NO_SHOW'] } },
      }),
      this.prisma.appointment.findMany({
        where: baseWhere,
        take: 10,
        orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
        include: {
          queue: true,
        },
      }),
      this.prisma.patientQueue.findMany({
        where: {
          status: { in: ['WAITING', 'CALLED', 'IN_ROOM'] },
          createdAt: { gte: startOfToday, lte: endOfToday },
          ...(clinicId && { clinicId }),
        },
        take: 8,
        orderBy: { tokenNumber: 'asc' },
      }),
    ]);

    return {
      stats: {
        todayAppointments: todayTotal,
        waitingPatients: waitingCount,
        checkedIn: checkedInCount,
        completedVisits: completedCount,
        cancelled: cancelledCount,
        availableDoctors: 8,
      },
      timeline: todayTimeline,
      liveQueue: activeQueue,
    };
  }

  async receptionistCheckIn(dto: ReceptionistCheckInDto, actorId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        queue: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.queue) {
      return {
        message: 'Patient is already checked in',
        queue: appointment.queue,
      };
    }

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
      599,
    );

    const lastQueue = await this.prisma.patientQueue.findFirst({
      where: {
        doctorId: appointment.doctorId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true },
    });

    const nextTokenNumber = (lastQueue?.tokenNumber || 0) + 1;
    const roomNumber = dto.roomNumber || 'Room 101';

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CHECKED_IN as any },
    });

    const queueEntry = await this.prisma.patientQueue.create({
      data: {
        tokenNumber: nextTokenNumber,
        queueNumber: nextTokenNumber,
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        clinicId: appointment.clinicId || 'clinic-1',
        roomNumber,
        status: QueueStatus.WAITING as any,
      },
    });

    return queueEntry;
  }

  async receptionistGetLiveQueue(clinicId?: string, doctorId?: string) {
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
      599,
    );

    const where: any = {
      createdAt: { gte: startOfToday, lte: endOfToday },
    };
    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.patientQueue.findMany({
      where,
      orderBy: [{ status: 'asc' }, { tokenNumber: 'asc' }],
      include: {
        appointment: true,
      },
    });
  }

  async receptionistUpdateQueueStatus(
    queueId: string,
    status: QueueStatus,
    actorId?: string,
  ) {
    const queue = await this.prisma.patientQueue.findUnique({
      where: { id: queueId },
      include: {
        appointment: true,
      },
    });

    if (!queue) {
      throw new NotFoundException('Queue token not found');
    }

    const updateData: any = { status: status as any };
    let apptStatus: AppointmentStatus | null = null;

    if (status === QueueStatus.CALLED) {
      updateData.calledAt = new Date();
    } else if (status === QueueStatus.IN_ROOM) {
      apptStatus = AppointmentStatus.IN_PROGRESS;
    } else if (status === QueueStatus.COMPLETED) {
      updateData.completedAt = new Date();
      apptStatus = AppointmentStatus.COMPLETED;
    } else if (status === QueueStatus.NO_SHOW) {
      apptStatus = AppointmentStatus.NO_SHOW;
    }

    const updatedQueue = await this.prisma.patientQueue.update({
      where: { id: queueId },
      data: updateData,
    });

    if (apptStatus && queue.appointmentId) {
      await this.prisma.appointment
        .update({
          where: { id: queue.appointmentId },
          data: { status: apptStatus as any },
        })
        .catch(() => null);
    }

    return updatedQueue;
  }

  async receptionistWalkInBooking(
    dto: ReceptionistWalkInBookingDto,
    actorId?: string,
  ) {
    const now = new Date();
    const appointmentNumber = `WALK-${Date.now().toString().slice(-6)}`;
    const time =
      dto.time ||
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId: dto.patientId || `patient-walkin-${Date.now()}`,
        patientName: dto.patientName || 'Walk-in Patient',
        doctorId: dto.doctorId,
        clinicId: dto.clinicId,
        date: now,
        time,
        type: (dto.type as any) || AppointmentType.IN_PERSON,
        status: AppointmentStatus.CONFIRMED as any,
        isPaid: false,
        notes: dto.notes || 'Walk-in booking created at reception desk',
      },
    });

    return this.receptionistCheckIn(
      {
        appointmentId: appointment.id,
        roomNumber: dto.roomNumber || 'Room 101',
        notes: dto.notes,
      },
      actorId,
    );
  }
}
