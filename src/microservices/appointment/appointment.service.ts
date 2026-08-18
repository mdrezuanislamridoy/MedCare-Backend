import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { LiveQueueEventService } from '../../common/events/live-queue-event.service';
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
  PaymentStatus,
  AppointmentType,
  QueueStatus,
} from '../../../generated/prisma/client';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly queueEventService?: LiveQueueEventService,
  ) {}

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
        {
          patient: {
            user: { name: { contains: filter.q, mode: 'insensitive' } },
          },
        },
        {
          doctor: {
            user: { name: { contains: filter.q, mode: 'insensitive' } },
          },
        },
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
          transactions: {
            select: { id: true, amount: true, status: true, provider: true },
          },
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

  async transitionStatus(
    id: string,
    dto: TransitionAppointmentStatusDto,
    actorId?: string,
  ) {
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
        cancellationReason:
          dto.cancellationReason || appointment.cancellationReason,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: `Appointment ${appointment.appointmentNumber} status -> ${dto.status}`,
          resource: `Appointment ${appointment.appointmentNumber}`,
          details: dto.cancellationReason
            ? JSON.stringify({ cancellationReason: dto.cancellationReason })
            : undefined,
          result: 'success',
        },
      })
      .catch(() => null);

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
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
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
        status: AppointmentStatus.CONFIRMED,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: `Appointment ${appointment.appointmentNumber} Rescheduled`,
          resource: `Appointment ${appointment.appointmentNumber}`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

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

  async patientListAppointments(
    userId: string,
    filter: PatientAppointmentFilterDto,
  ) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { patientId };

    if (filter.type) {
      where.type = filter.type;
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
          doctor: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              clinic: true,
            },
          },
          clinic: true,
          prescription: true,
          transactions: {
            select: { id: true, amount: true, status: true, provider: true },
          },
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
      throw new BadRequestException(
        'This slot has already been booked. Please choose another slot.',
      );
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

  async patientCancelAppointment(
    userId: string,
    appointmentId: string,
    reason?: string,
  ) {
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

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${appointment.status.toLowerCase()} appointment`,
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by patient',
      },
    });
  }

  async patientRescheduleAppointment(
    userId: string,
    appointmentId: string,
    dto: RescheduleAppointmentDto,
  ) {
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

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot reschedule a ${appointment.status.toLowerCase()} appointment`,
      );
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
      throw new BadRequestException(
        'This slot has already been booked. Please pick another slot.',
      );
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

  async patientGetVideoSession(userId: string, appointmentId: string) {
    const patientId = await this.getPatientIdFromUserId(userId);
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            clinic: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (
      appointment.patientId !== patientId &&
      appointment.doctor.userId !== userId
    ) {
      throw new ForbiddenException(
        'You are not authorized to join this consultation',
      );
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('This appointment has been cancelled');
    }

    const roomId = `medcare-video-${appointment.id}`;
    const token = Buffer.from(
      JSON.stringify({
        roomId,
        userId,
        userName: appointment.patient.user.name,
        role: 'patient',
        appointmentId: appointment.id,
        issuedAt: Date.now(),
        expiresIn: 3600 * 2, // 2 hours
      }),
    ).toString('base64');

    return {
      roomId,
      roomName: `Consultation with Dr. ${appointment.doctor.user.name}`,
      token,
      provider: 'WebRTC / Agora',
      type: appointment.type,
      status: appointment.status,
      appointment: {
        id: appointment.id,
        appointmentNumber: appointment.appointmentNumber,
        date: appointment.date,
        time: appointment.time,
        doctorName: appointment.doctor.user.name,
        doctorSpecialty: appointment.doctor.specialty,
        clinicName: appointment.doctor.clinic?.name || 'MedCare Main Clinic',
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
      availableDoctors,
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
      this.prisma.doctorProfile.count({
        where: {
          isAvailableToday: true,
          accountStatus: 'ACTIVE',
          ...(clinicId && { clinicId }),
        },
      }),
      this.prisma.appointment.findMany({
        where: baseWhere,
        take: 10,
        orderBy: [{ time: 'asc' }, { createdAt: 'asc' }],
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
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
        orderBy: { queueNumber: 'asc' },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { include: { user: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      stats: {
        todayAppointments: todayTotal,
        waitingPatients: waitingCount,
        checkedIn: checkedInCount,
        completedVisits: completedCount,
        cancelled: cancelledCount,
        availableDoctors,
      },
      timeline: todayTimeline,
      liveQueue: activeQueue,
    };
  }

  async receptionistCheckIn(dto: ReceptionistCheckInDto, actorId?: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        queue: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot check in a cancelled appointment');
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
    );

    const lastQueue = await this.prisma.patientQueue.findFirst({
      where: {
        doctorId: appointment.doctorId,
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { queueNumber: 'desc' },
      select: { queueNumber: true },
    });

    const nextQueueNumber = (lastQueue?.queueNumber || 0) + 1;
    const roomNumber =
      dto.roomNumber || appointment.doctor.roomNumber || 'Room 101';

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CHECKED_IN },
    });

    const queueEntry = await this.prisma.patientQueue.create({
      data: {
        queueNumber: nextQueueNumber,
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        clinicId: appointment.clinicId,
        roomNumber,
        status: QueueStatus.WAITING,
        checkInTime: new Date(),
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Receptionist',
          action: `Patient Check-in: Token #${nextQueueNumber}`,
          resource: `Appointment ${appointment.appointmentNumber} (${appointment.patient.user.name || 'Patient'})`,
          details: JSON.stringify({ queueNumber: nextQueueNumber, roomNumber }),
          result: 'success',
        },
      })
      .catch(() => null);

    this.queueEventService?.emit({
      type: 'CHECKED_IN',
      queueNumber: nextQueueNumber,
      roomNumber,
      patientName: appointment.patient.user.name || 'Patient',
      doctorName: appointment.doctor.user.name || 'Doctor',
      clinicId: appointment.clinicId || undefined,
      timestamp: new Date().toISOString(),
      data: queueEntry,
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
    );

    const where: any = {
      createdAt: { gte: startOfToday, lte: endOfToday },
    };
    if (clinicId) where.clinicId = clinicId;
    if (doctorId) where.doctorId = doctorId;

    return this.prisma.patientQueue.findMany({
      where,
      orderBy: [{ status: 'asc' }, { queueNumber: 'asc' }],
      include: {
        patient: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        doctor: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        appointment: {
          select: {
            appointmentNumber: true,
            time: true,
            type: true,
            paymentStatus: true,
          },
        },
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
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
      },
    });

    if (!queue) {
      throw new NotFoundException('Queue token not found');
    }

    const updateData: any = { status };
    let apptStatus: AppointmentStatus | null = null;

    if (status === QueueStatus.CALLED) {
      updateData.calledAt = new Date();
    } else if (status === QueueStatus.IN_ROOM) {
      updateData.inRoomAt = new Date();
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
          data: { status: apptStatus },
        })
        .catch(() => null);
    }

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Receptionist',
          action: `Queue Status Updated to ${status}`,
          resource: `Queue #${queue.queueNumber} (${queue.patient.user.name || 'Patient'})`,
          details: JSON.stringify({ status }),
          result: 'success',
        },
      })
      .catch(() => null);

    this.queueEventService?.emit({
      type: status as any,
      queueNumber: queue.queueNumber,
      roomNumber: queue.roomNumber || undefined,
      patientName: queue.patient.user.name || 'Patient',
      doctorName: queue.doctor.user.name || 'Doctor',
      clinicId: queue.clinicId || undefined,
      timestamp: new Date().toISOString(),
      data: updatedQueue,
    });

    return updatedQueue;
  }

  async receptionistWalkInBooking(
    dto: ReceptionistWalkInBookingDto,
    actorId?: string,
  ) {
    let patientId = dto.patientId;

    if (!patientId && dto.patientName) {
      let user = await this.prisma.user.findFirst({
        where: { email: `walkin-${Date.now()}@medcare.local` },
      });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: `walkin-${Date.now()}@medcare.local`,
            name: dto.patientName,
            role: 'PATIENT',
          },
        });
      }
      const profile = await this.prisma.patientProfile.create({
        data: {
          userId: user.id,
          phone: dto.phone,
        },
      });
      patientId = profile.id;
    }

    if (!patientId) {
      throw new BadRequestException(
        'Patient information is required for walk-in booking',
      );
    }

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const now = new Date();
    const appointmentNumber = `WALK-${Date.now().toString().slice(-6)}`;
    const time =
      dto.time ||
      `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const appointment = await this.prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId,
        doctorId: dto.doctorId,
        clinicId: dto.clinicId || doctor.clinicId,
        date: now,
        time,
        type: dto.type || AppointmentType.IN_PERSON,
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
        notes: dto.notes || 'Walk-in booking created at reception desk',
      },
    });

    return this.receptionistCheckIn(
      {
        appointmentId: appointment.id,
        roomNumber: dto.roomNumber || doctor.roomNumber || 'Room 101',
        notes: dto.notes,
      },
      actorId,
    );
  }
}
