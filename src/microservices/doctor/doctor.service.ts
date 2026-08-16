import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { RedisService } from '../../common/cache/redis/redis.service';
import { AccountStatus, VerificationStatus } from '../../../generated/prisma/client';
import { DoctorFilterDto, VerificationDecisionDto, PatientDoctorSearchDto } from './dto/doctor.dto';

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

  // --- Patient Portal Methods ---

  async patientSearchDoctors(filter: PatientDoctorSearchDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
    };

    if (filter.specialty) {
      where.specialty = { contains: filter.specialty, mode: 'insensitive' };
    }
    if (filter.clinicId) {
      where.clinicId = filter.clinicId;
    }
    if (filter.minRating) {
      where.rating = { gte: Number(filter.minRating) };
    }
    if (filter.q) {
      where.OR = [
        { specialty: { contains: filter.q, mode: 'insensitive' } },
        { bio: { contains: filter.q, mode: 'insensitive' } },
        { user: { name: { contains: filter.q, mode: 'insensitive' } } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          clinic: { select: { id: true, name: true, location: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
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
          where: { status: 'PUBLISHED' },
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
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async patientGetDoctorSlots(doctorId: string, dateStr: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS'] },
      },
      select: { time: true },
    });

    const bookedTimes = new Set(bookedAppointments.map(a => a.time));

    const defaultSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
      '05:00 PM', '05:30 PM', '06:00 PM',
    ];

    const slots = defaultSlots.map(time => ({
      time,
      available: !bookedTimes.has(time),
    }));

    return {
      doctorId,
      date: dateStr,
      slots,
    };
  }

  // --- Receptionist Portal Methods ---

  async receptionistGetScheduleGrid(dateStr?: string, clinicId?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
    };
    if (clinicId) where.clinicId = clinicId;

    const doctors = await this.prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { in: ['CONFIRMED', 'PENDING', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED'] },
        ...(clinicId && { clinicId }),
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
      },
    });

    const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    const doctorSchedules = doctors.map(doc => {
      const docAppointments = appointments.filter(a => a.doctorId === doc.id);
      const slots = hours.map(hour => {
        const matchingAppt = docAppointments.find(a => {
          const apptTime = a.time.toUpperCase();
          const hour24 = parseInt(hour.split(':')[0], 10);
          const isPM = apptTime.includes('PM');
          let [h] = apptTime.replace(/AM|PM/g, '').trim().split(':').map(Number);
          if (isPM && h !== 12) h += 12;
          if (!isPM && h === 12) h = 0;
          return h === hour24;
        });

        return {
          hour,
          booked: !!matchingAppt,
          appointment: matchingAppt
            ? {
                id: matchingAppt.id,
                appointmentNumber: matchingAppt.appointmentNumber,
                patientName: matchingAppt.patient.user.name || 'Patient',
                type: matchingAppt.type,
                status: matchingAppt.status,
              }
            : null,
        };
      });

      return {
        doctorId: doc.id,
        doctorName: doc.user.name || 'Doctor',
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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const where: any = {
      accountStatus: AccountStatus.ACTIVE,
      verificationStatus: VerificationStatus.APPROVED,
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

    return doctors.map(doc => ({
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
