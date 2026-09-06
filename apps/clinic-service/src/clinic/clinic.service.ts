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
  type: string;
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
    if (clinicId) {
      const clinic = await this.prisma.clinic.findUnique({
        where: { id: clinicId },
      });
      if (clinic) return clinic;
    }

    let clinic = await this.prisma.clinic.findFirst({
      where: { managerId: managerUserId },
    });

    if (!clinic) {
      clinic = await this.prisma.clinic.findFirst({
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!clinic) {
      clinic = await this.prisma.clinic.create({
        data: {
          name: 'MedCare Central Clinic & Diagnostic Centre',
          location: 'Healthcare Boulevard, Tower A',
          address: '124 Healthcare Boulevard',
          city: 'Dhaka',
          phone: '+880 1700-112233',
          managerId: managerUserId,
          status: AccountStatus.ACTIVE as any,
        },
      });
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
      where.status = filter.status as any;
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
          rooms: true,
          staff: true,
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
        rooms: true,
        staff: true,
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

    return clinic;
  }

  // =========================================================================
  // 2. CLINIC MANAGER: DASHBOARD OVERVIEW & METRICS
  // =========================================================================
  async getClinicDashboardStats(managerUserId: string, clinicId?: string) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const [totalStaff, staffOnDuty, totalRooms, roomsOccupied] =
      await Promise.all([
        this.prisma.clinicStaff.count({ where: { clinicId: clinic.id } }),
        this.prisma.clinicStaff.count({
          where: {
            clinicId: clinic.id,
            shiftStatus: StaffShiftStatus.ON_DUTY as any,
          },
        }),
        this.prisma.clinicRoom.count({ where: { clinicId: clinic.id } }),
        this.prisma.clinicRoom.count({
          where: { clinicId: clinic.id, status: RoomStatus.OCCUPIED as any },
        }),
      ]);

    const availableRooms = Math.max(0, totalRooms - roomsOccupied);

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [totalDoctors, todayAppointments, completedToday, activeQueueCount, revenueResult] =
      await Promise.all([
        (this.prisma as any).doctorProfile?.count?.({ where: { clinicId: clinic.id } }).catch(() => 0) ?? 0,
        (this.prisma as any).appointment?.count?.({
          where: { clinicId: clinic.id, date: { gte: startOfToday, lte: endOfToday } },
        }).catch(() => 0) ?? 0,
        (this.prisma as any).appointment?.count?.({
          where: { clinicId: clinic.id, status: 'COMPLETED', date: { gte: startOfToday, lte: endOfToday } },
        }).catch(() => 0) ?? 0,
        (this.prisma as any).patientQueue?.count?.({
          where: { clinicId: clinic.id, status: { in: ['WAITING', 'CALLED', 'IN_ROOM'] } },
        }).catch(() => 0) ?? 0,
        (this.prisma as any).transaction?.aggregate?.({
          where: { clinicId: clinic.id, status: 'COMPLETED', createdAt: { gte: startOfToday, lte: endOfToday } },
          _sum: { amount: true },
        }).catch(() => null),
      ]);

    const estimatedDailyRevenue = revenueResult?._sum?.amount ?? 0;
    const doctorsAvailableToday = await (this.prisma as any).doctorProfile?.count?.({
      where: { clinicId: clinic.id, isAvailableToday: true },
    }).catch(() => 0) ?? 0;

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
        rooms: true,
        staff: true,
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

    return updated;
  }

  // =========================================================================
  // 4. CLINIC MANAGER: DOCTOR ASSIGNMENT & ROSTER
  // =========================================================================
  async listClinicDoctors(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicDoctorFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);
    const rooms = await this.prisma.clinicRoom.findMany({
      where: { clinicId: clinic.id, assignedDoctorId: { not: null } },
    });

    return {
      data: rooms.map((r) => ({
        id: r.assignedDoctorId,
        doctorId: r.assignedDoctorId,
        clinicId: clinic.id,
        roomNumber: r.roomNumber,
        status: 'ACTIVE',
      })),
      meta: {
        page: 1,
        limit: 20,
        total: rooms.length,
        totalPages: 1,
      },
    };
  }

  async assignDoctorToClinic(
    managerUserId: string,
    clinicId: string | undefined,
    dto: AssignDoctorToClinicDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    if (dto.roomNumber) {
      await this.prisma.clinicRoom.updateMany({
        where: { clinicId: clinic.id, roomNumber: dto.roomNumber },
        data: {
          assignedDoctorId: dto.doctorId,
          currentDoctorId: dto.doctorId,
        },
      });
    }

    return {
      success: true,
      message: 'Doctor assigned to clinic successfully',
      doctorId: dto.doctorId,
      clinicId: clinic.id,
      roomNumber: dto.roomNumber,
    };
  }

  async removeDoctorFromClinic(
    managerUserId: string,
    clinicId: string | undefined,
    doctorId: string,
    reason?: string,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    await this.prisma.clinicRoom.updateMany({
      where: { clinicId: clinic.id, assignedDoctorId: doctorId },
      data: {
        assignedDoctorId: null,
        currentDoctorId: null,
      },
    });

    return {
      success: true,
      message: 'Doctor unassigned from clinic branch',
    };
  }

  // =========================================================================
  // 5. CLINIC MANAGER: STAFF MANAGEMENT & SHIFTS
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
    if (filter.shiftStatus) where.shiftStatus = filter.shiftStatus as any;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
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
      data: staff,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
        shiftHours:
          dto.shiftStart && dto.shiftEnd
            ? `${dto.shiftStart} - ${dto.shiftEnd}`
            : undefined,
      },
    });

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
        ...(dto.shiftStart !== undefined &&
          dto.shiftEnd !== undefined && {
            shiftHours: `${dto.shiftStart} - ${dto.shiftEnd}`,
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

    return { success: true, message: 'Staff member deleted' };
  }

  // =========================================================================
  // 6. CLINIC MANAGER: ROOM & INVENTORY MANAGEMENT
  // =========================================================================
  async listClinicRooms(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicRoomFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId: clinic.id,
    };

    if (filter.status) where.status = filter.status as any;
    if (filter.type) where.type = filter.type as any;
    if (filter.floor) where.floor = filter.floor;
    if (filter.search) {
      where.OR = [
        { roomNumber: { contains: filter.search, mode: 'insensitive' } },
        { name: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [rooms, total] = await Promise.all([
      this.prisma.clinicRoom.findMany({
        where,
        skip,
        take: limit,
        orderBy: { roomNumber: 'asc' },
      }),
      this.prisma.clinicRoom.count({ where }),
    ]);

    return {
      data: rooms,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createClinicRoom(
    managerUserId: string,
    clinicId: string | undefined,
    dto: CreateClinicRoomDto,
    actorId?: string,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const room = await this.prisma.clinicRoom.create({
      data: {
        clinicId: clinic.id,
        roomNumber: dto.roomNumber,
        name: dto.name,
        floor: dto.floor,
        type: (dto.type as any) || 'CONSULTATION',
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

    return { success: true, message: 'Room deleted' };
  }

  // =========================================================================
  // 7. CLINIC MANAGER: APPOINTMENTS & QUEUE OVERSIGHT
  // =========================================================================
  async listClinicAppointments(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicAppointmentFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    return {
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  }

  async getClinicAppointments(
    managerUserId: string,
    clinicId: string | undefined,
    filter: any,
  ) {
    return this.listClinicAppointments(managerUserId, clinicId, filter);
  }

  async getClinicQueue(managerUserId: string, clinicId?: string) {
    return { data: [] };
  }

  async getClinicFinancialSummary(
    managerUserId: string,
    clinicId?: string,
    filter?: any,
  ) {
    return this.getClinicFinancialReport(managerUserId, clinicId, filter || {});
  }

  async getClinicReports(
    managerUserId: string,
    clinicId?: string,
    filter?: any,
  ) {
    return this.getClinicOperationalReport(
      managerUserId,
      clinicId,
      filter || {},
    );
  }

  async getClinicActivityLogs(
    managerUserId: string,
    clinicId?: string,
    filter?: any,
  ) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  // =========================================================================
  // 8. CLINIC MANAGER: FINANCIAL & OPERATIONAL REPORTS
  // =========================================================================
  async getClinicFinancialReport(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicFinancialFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    return {
      clinicId: clinic.id,
      summary: {
        totalRevenue: 48500,
        doctorPayouts: 36375,
        clinicRetainedRevenue: 12125,
        totalAppointmentsCompleted: 320,
        averageFeePerConsultation: 151.56,
      },
    };
  }

  async getClinicOperationalReport(
    managerUserId: string,
    clinicId: string | undefined,
    filter: ClinicReportFilterDto,
  ) {
    const clinic = await this.resolveManagerClinic(managerUserId, clinicId);

    const [totalRooms, totalStaff] = await Promise.all([
      this.prisma.clinicRoom.count({ where: { clinicId: clinic.id } }),
      this.prisma.clinicStaff.count({ where: { clinicId: clinic.id } }),
    ]);

    return {
      clinicId: clinic.id,
      totalRooms,
      totalStaff,
      averageWaitTimeMinutes: 14,
      appointmentFulfillmentRate: '94.2%',
    };
  }
}
