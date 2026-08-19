import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountStatus,
  AppointmentStatus,
  RoomStatus,
  StaffShiftStatus,
  UserRole,
} from '@medcare/contracts';
import {
  ClinicFilterDto,
  CreateClinicDto,
  UpdateClinicDto,
} from './dto/clinic.dto';
import {
  UpdateClinicBranchProfileDto,
  AssignDoctorToClinicDto,
  CreateClinicStaffDto,
  UpdateClinicStaffDto,
  CreateClinicRoomDto,
  UpdateClinicRoomDto,
  ClinicDoctorFilterDto,
  ClinicStaffFilterDto,
  ClinicRoomFilterDto,
  ClinicAppointmentFilterDto,
  ClinicFinancialFilterDto,
  ClinicReportFilterDto,
} from './dto/clinic-manager.dto';

export interface ClinicLiveEvent {
  type:
    | 'ROOM_STATUS_CHANGED'
    | 'QUEUE_UPDATED'
    | 'STAFF_SHIFT_CHANGED'
    | 'APPOINTMENT_SCHEDULED';
  clinicId: string;
  payload: any;
  timestamp: string;
}

@Injectable()
export class ClinicService {
  private readonly clinicEventSubject = new Subject<ClinicLiveEvent>();

  constructor(private readonly prisma: PrismaService) {}

  getStream(): Observable<ClinicLiveEvent> {
    return this.clinicEventSubject.asObservable();
  }

  // =========================================================================
  // HELPER: RESOLVE CLINIC BRANCH FOR MANAGER
  // =========================================================================
  async resolveManagerClinic(managerUserId: string, clinicId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: managerUserId },
    });

    if (!user) {
      throw new NotFoundException(`User ${managerUserId} not found`);
    }

    // Admins and Super Admins can query any clinic
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      if (clinicId) {
        const clinic = await this.prisma.clinic.findUnique({
          where: { id: clinicId },
        });
        if (!clinic)
          throw new NotFoundException(`Clinic ${clinicId} not found`);
        return clinic;
      }
      const firstClinic = await this.prisma.clinic.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (firstClinic) return firstClinic;
    }

    // Check if manager is explicitly assigned to a clinic
    let clinic = await this.prisma.clinic.findFirst({
      where: clinicId
        ? { id: clinicId, managerId: managerUserId }
        : { managerId: managerUserId },
    });

    // If manager has no clinic yet, auto-assign or create default branch
    if (!clinic) {
      clinic = await this.prisma.clinic.findFirst({
        where: { managerId: null },
      });

      if (clinic) {
        clinic = await this.prisma.clinic.update({
          where: { id: clinic.id },
          data: { managerId: managerUserId },
        });
      } else {
        clinic = await this.prisma.clinic.create({
          data: {
            name: 'MedCare Central Clinic & Diagnostic Centre',
            location: 'Healthcare Boulevard, Tower A',
            address: '124 Healthcare Boulevard',
            city: 'Dhaka',
            phone: '+880 1700-112233',
            email: user.email,
            managerId: managerUserId,
            status: AccountStatus.ACTIVE,
          },
        });
      }
    }

    return clinic;
  }

  // =========================================================================
  // 1. ADMIN CLINIC CRUD METHODS
  // =========================================================================
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
          _count: {
            select: {
              doctors: true,
              appointments: true,
              rooms: true,
              staff: true,
            },
          },
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
        rooms: true,
        staff: true,
        _count: {
          select: {
            doctors: true,
            appointments: true,
            rooms: true,
            staff: true,
          },
        },
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

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: 'Clinic Created',
          resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
          details: JSON.stringify(data),
          result: 'success',
        },
      })
      .catch(() => null);

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

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: 'Clinic Updated',
          resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
          details: JSON.stringify(data),
          result: 'success',
        },
      })
      .catch(() => null);

    return clinic;
  }

  async updateClinicStatus(
    id: string,
    status: AccountStatus,
    reason?: string,
    actorId?: string,
  ) {
    const clinic = await this.prisma.clinic.update({
      where: { id },
      data: { status: status as any },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          actorName: 'Admin',
          action: `Clinic Status Updated to ${status}`,
          resource: `Clinic ${clinic.name} (ID: ${clinic.id})`,
          details: reason ? JSON.stringify({ reason }) : undefined,
          result: 'success',
        },
      })
      .catch(() => null);

    return clinic;
  }

  // =========================================================================
  // 2. CLINIC MANAGER: DASHBOARD OVERVIEW & METRICS
  // =========================================================================
  async getClinicDashboardStats(managerUserId: string, clinicId?: string) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalDoctors,
      doctorsAvailableToday,
      totalStaff,
      staffOnDuty,
      totalRooms,
      roomsOccupied,
      todayAppointments,
      activeQueueCount,
      completedToday,
    ] = await Promise.all([
      this.prisma.doctorProfile.count({ where: { clinicId: clinic.id } }),
      this.prisma.doctorProfile.count({
        where: { clinicId: clinic.id, isAvailableToday: true },
      }),
      this.prisma.clinicStaff.count({ where: { clinicId: clinic.id } }),
      this.prisma.clinicStaff.count({
        where: { clinicId: clinic.id, shiftStatus: StaffShiftStatus.ON_DUTY },
      }),
      this.prisma.clinicRoom.count({ where: { clinicId: clinic.id } }),
      this.prisma.clinicRoom.count({
        where: { clinicId: clinic.id, status: RoomStatus.OCCUPIED },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.patientQueue.count({
        where: {
          clinicId: clinic.id,
          status: 'WAITING',
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          status: AppointmentStatus.COMPLETED,
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    const estimatedDailyRevenue = completedToday * 150;
    const availableRooms = Math.max(0, totalRooms - roomsOccupied);

    return {
      clinic: {
        id: clinic.id,
        name: clinic.name,
        location: clinic.location,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email,
        status: clinic.status,
      },
      stats: {
        totalDoctors,
        doctorsAvailableToday,
        totalStaff,
        staffOnDuty,
        totalRooms,
        availableRooms,
        roomsOccupied,
        todayAppointments,
        completedToday,
        activeQueueCount,
        estimatedDailyRevenue,
      },
    };
  }

  // =========================================================================
  // 3. CLINIC MANAGER: BRANCH PROFILE
  // =========================================================================
  async getClinicProfile(managerUserId: string, clinicId?: string) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);
    return this.prisma.clinic.findUnique({
      where: { id: clinic.id },
      include: {
        manager: { select: { id: true, name: true, email: true, role: true } },
        _count: {
          select: {
            doctors: true,
            rooms: true,
            staff: true,
            appointments: true,
          },
        },
      },
    });
  }

  async updateClinicProfile(
    managerUserId: string,
    clinicId: string | undefined,
    dto: UpdateClinicBranchProfileDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const updated = await this.prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.location && { location: dto.location }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actorId || managerUserId,
          actorName: 'Clinic Manager',
          action: 'Clinic Profile Updated',
          resource: `Clinic ${updated.name} (ID: ${updated.id})`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

    return updated;
  }

  // =========================================================================
  // 4. CLINIC MANAGER: DOCTORS MANAGEMENT
  // =========================================================================
  async listClinicDoctors(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicDoctorFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId: clinic.id,
    };

    if (filter.specialty) {
      where.specialty = { contains: filter.specialty, mode: 'insensitive' };
    }
    if (filter.search) {
      where.OR = [
        { user: { name: { contains: filter.search, mode: 'insensitive' } } },
        { user: { email: { contains: filter.search, mode: 'insensitive' } } },
        { specialty: { contains: filter.search, mode: 'insensitive' } },
        { roomNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [doctors, total] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          assignedRooms: true,
          _count: { select: { appointments: true, reviews: true } },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      this.prisma.doctorProfile.count({ where }),
    ]);

    return {
      items: doctors,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async assignDoctorToClinic(
    managerUserId: string,
    clinicId: string | undefined,
    dto: AssignDoctorToClinicDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor ${dto.doctorId} not found`);
    }

    const updated = await this.prisma.doctorProfile.update({
      where: { id: dto.doctorId },
      data: {
        clinicId: clinic.id,
        ...(dto.roomNumber && { roomNumber: dto.roomNumber }),
      },
      include: { user: true },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actorId || managerUserId,
          actorName: 'Clinic Manager',
          action: 'Doctor Assigned to Clinic',
          resource: `Doctor ${doctor.user.name || doctor.user.email} -> Clinic ${clinic.name}`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

    return updated;
  }

  async removeDoctorFromClinic(
    managerUserId: string,
    clinicId: string | undefined,
    doctorId: string,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const doctor = await this.prisma.doctorProfile.findFirst({
      where: { id: doctorId, clinicId: clinic.id },
      include: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor ${doctorId} not assigned to this clinic`,
      );
    }

    await this.prisma.doctorProfile.update({
      where: { id: doctorId },
      data: { clinicId: null, roomNumber: null },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actorId || managerUserId,
          actorName: 'Clinic Manager',
          action: 'Doctor Removed from Clinic',
          resource: `Doctor ${doctor.user.name || doctor.user.email} removed from Clinic ${clinic.name}`,
          result: 'success',
        },
      })
      .catch(() => null);

    return {
      success: true,
      message: 'Doctor successfully unassigned from clinic',
    };
  }

  // =========================================================================
  // 5. CLINIC MANAGER: STAFF ROSTER MANAGEMENT
  // =========================================================================
  async listClinicStaff(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicStaffFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId: clinic.id,
    };

    if (filter.role) where.role = filter.role;
    if (filter.shiftStatus) where.shiftStatus = filter.shiftStatus;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        {
          assignedDepartment: { contains: filter.search, mode: 'insensitive' },
        },
      ];
    }

    const [staff, total] = await Promise.all([
      this.prisma.clinicStaff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.clinicStaff.count({ where }),
    ]);

    return {
      items: staff,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createClinicStaff(
    managerUserId: string,
    clinicId: string | undefined,
    dto: CreateClinicStaffDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const staff = await this.prisma.clinicStaff.create({
      data: {
        clinicId: clinic.id,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role as any,
        shiftStatus: (dto.shiftStatus || StaffShiftStatus.OFF_DUTY) as any,
        shiftStart: dto.shiftStart,
        shiftEnd: dto.shiftEnd,
        assignedDepartment: dto.assignedDepartment,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actorId || managerUserId,
          actorName: 'Clinic Manager',
          action: 'Clinic Staff Created',
          resource: `Staff ${staff.name} (${staff.role}) -> Clinic ${clinic.name}`,
          details: JSON.stringify(dto),
          result: 'success',
        },
      })
      .catch(() => null);

    return staff;
  }

  async updateClinicStaff(
    managerUserId: string,
    clinicId: string | undefined,
    staffId: string,
    dto: UpdateClinicStaffDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const staff = await this.prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId: clinic.id },
    });

    if (!staff) {
      throw new NotFoundException(
        `Staff member ${staffId} not found in this clinic`,
      );
    }

    const updated = await this.prisma.clinicStaff.update({
      where: { id: staffId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.role && { role: dto.role as any }),
        ...(dto.shiftStatus && { shiftStatus: dto.shiftStatus as any }),
        ...(dto.shiftStart !== undefined && { shiftStart: dto.shiftStart }),
        ...(dto.shiftEnd !== undefined && { shiftEnd: dto.shiftEnd }),
        ...(dto.assignedDepartment !== undefined && {
          assignedDepartment: dto.assignedDepartment,
        }),
      },
    });

    return updated;
  }

  async deleteClinicStaff(
    managerUserId: string,
    clinicId: string | undefined,
    staffId: string,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const staff = await this.prisma.clinicStaff.findFirst({
      where: { id: staffId, clinicId: clinic.id },
    });

    if (!staff) {
      throw new NotFoundException(`Staff member ${staffId} not found`);
    }

    await this.prisma.clinicStaff.delete({ where: { id: staffId } });

    return {
      success: true,
      message: 'Staff member removed from clinic roster',
    };
  }

  // =========================================================================
  // 6. CLINIC MANAGER: ROOMS MANAGEMENT
  // =========================================================================
  async listClinicRooms(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicRoomFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const where: any = {
      clinicId: clinic.id,
    };

    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.search) {
      where.OR = [
        { roomNumber: { contains: filter.search, mode: 'insensitive' } },
        { name: { contains: filter.search, mode: 'insensitive' } },
        { floor: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const rooms = await this.prisma.clinicRoom.findMany({
      where,
      include: {
        currentDoctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { roomNumber: 'asc' },
    });

    return rooms;
  }

  async createClinicRoom(
    managerUserId: string,
    clinicId: string | undefined,
    dto: CreateClinicRoomDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const existing = await this.prisma.clinicRoom.findUnique({
      where: {
        clinicId_roomNumber: {
          clinicId: clinic.id,
          roomNumber: dto.roomNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Room number ${dto.roomNumber} already exists in this clinic`,
      );
    }

    const room = await this.prisma.clinicRoom.create({
      data: {
        clinicId: clinic.id,
        roomNumber: dto.roomNumber,
        name: dto.name,
        floor: dto.floor,
        type: dto.type as any,
        status: (dto.status || RoomStatus.AVAILABLE) as any,
        capacity: dto.capacity || 1,
        equipment: (dto.equipment as any) || [],
        currentDoctorId: dto.currentDoctorId,
      },
    });

    this.clinicEventSubject.next({
      type: 'ROOM_STATUS_CHANGED',
      clinicId: clinic.id,
      payload: room,
      timestamp: new Date().toISOString(),
    });

    return room;
  }

  async updateClinicRoom(
    managerUserId: string,
    clinicId: string | undefined,
    roomId: string,
    dto: UpdateClinicRoomDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const room = await this.prisma.clinicRoom.findFirst({
      where: { id: roomId, clinicId: clinic.id },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found in this clinic`);
    }

    const updated = await this.prisma.clinicRoom.update({
      where: { id: roomId },
      data: {
        ...(dto.roomNumber && { roomNumber: dto.roomNumber }),
        ...(dto.name && { name: dto.name }),
        ...(dto.floor !== undefined && { floor: dto.floor }),
        ...(dto.type && { type: dto.type as any }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.equipment && { equipment: dto.equipment as any }),
        ...(dto.currentDoctorId !== undefined && {
          currentDoctorId: dto.currentDoctorId,
        }),
      },
    });

    this.clinicEventSubject.next({
      type: 'ROOM_STATUS_CHANGED',
      clinicId: clinic.id,
      payload: updated,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async deleteClinicRoom(
    managerUserId: string,
    clinicId: string | undefined,
    roomId: string,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const room = await this.prisma.clinicRoom.findFirst({
      where: { id: roomId, clinicId: clinic.id },
    });

    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    await this.prisma.clinicRoom.delete({ where: { id: roomId } });

    return { success: true, message: 'Room deleted from clinic inventory' };
  }

  // =========================================================================
  // 7. CLINIC MANAGER: APPOINTMENTS & QUEUE
  // =========================================================================
  async getClinicAppointments(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicAppointmentFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId: clinic.id,
    };

    if (filter.status) where.status = filter.status;
    if (filter.doctorId) where.doctorId = filter.doctorId;
    if (filter.date) {
      const dateStart = new Date(filter.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(filter.date);
      dateEnd.setHours(23, 59, 59, 999);
      where.date = { gte: dateStart, lte: dateEnd };
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
            },
          },
          patient: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      items: appointments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getClinicQueue(managerUserId: string, clinicId?: string) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const queues = await this.prisma.patientQueue.findMany({
      where: {
        clinicId: clinic.id,
        createdAt: { gte: todayStart },
      },
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { queueNumber: 'asc' },
    });

    return queues;
  }

  // =========================================================================
  // 8. CLINIC MANAGER: FINANCIALS & REPORTS
  // =========================================================================
  async getClinicFinancialSummary(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicFinancialFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const where: any = {
      clinicId: clinic.id,
      status: AppointmentStatus.COMPLETED,
    };

    if (filter.startDate && filter.endDate) {
      where.date = {
        gte: new Date(filter.startDate),
        lte: new Date(filter.endDate),
      };
    }

    const completedAppointments = await this.prisma.appointment.findMany({
      where,
      select: {
        id: true,
        date: true,
        type: true,
        doctor: { select: { consultationFee: true, specialty: true } },
      },
    });

    const totalRevenue = completedAppointments.reduce(
      (sum, apt) => sum + (apt.doctor?.consultationFee || 150),
      0,
    );

    const inPersonRevenue = completedAppointments
      .filter((a) => a.type === 'IN_PERSON')
      .reduce((sum, apt) => sum + (apt.doctor?.consultationFee || 150), 0);

    const videoRevenue = completedAppointments
      .filter((a) => a.type === 'VIDEO')
      .reduce((sum, apt) => sum + (apt.doctor?.consultationFee || 150), 0);

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      totalCompletedVisits: completedAppointments.length,
      totalRevenue,
      inPersonRevenue,
      videoRevenue,
      averageTicketSize:
        completedAppointments.length > 0
          ? Math.round(totalRevenue / completedAppointments.length)
          : 0,
    };
  }

  async getClinicReports(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicReportFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);
    const days = parseInt(filter.periodDays || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalAppointments,
      completedCount,
      cancelledCount,
      doctorCount,
      roomCount,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { clinicId: clinic.id, createdAt: { gte: startDate } },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          status: AppointmentStatus.COMPLETED,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.appointment.count({
        where: {
          clinicId: clinic.id,
          status: AppointmentStatus.CANCELLED,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.doctorProfile.count({ where: { clinicId: clinic.id } }),
      this.prisma.clinicRoom.count({ where: { clinicId: clinic.id } }),
    ]);

    const completionRate =
      totalAppointments > 0
        ? Math.round((completedCount / totalAppointments) * 100)
        : 100;

    return {
      periodDays: days,
      clinicId: clinic.id,
      clinicName: clinic.name,
      metrics: {
        totalAppointments,
        completedAppointments: completedCount,
        cancelledAppointments: cancelledCount,
        completionRate: `${completionRate}%`,
        activeDoctors: doctorCount,
        totalRooms: roomCount,
      },
    };
  }

  async getClinicActivityLogs(
    managerUserId: string,
    clinicId: string | undefined,
    filter: { page?: number; limit?: number },
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          resource: { contains: clinic.name, mode: 'insensitive' },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({
        where: { resource: { contains: clinic.name, mode: 'insensitive' } },
      }),
    ]);

    return {
      items: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
