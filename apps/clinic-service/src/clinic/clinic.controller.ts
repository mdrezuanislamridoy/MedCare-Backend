import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS, AccountStatus } from '@medcare/contracts';
import { ClinicService } from './clinic.service';
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

@Controller()
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  // ==========================================
  // ADMIN CLINIC MANAGEMENT
  // ==========================================
  @MessagePattern(PATTERNS.CLINIC.LIST)
  async listClinics(@Payload() filter: ClinicFilterDto) {
    return this.clinicService.listClinics(filter);
  }

  @MessagePattern(PATTERNS.CLINIC.CREATE)
  async createClinic(
    @Payload() payload: { data: CreateClinicDto; actorId?: string },
  ) {
    return this.clinicService.createClinic(payload.data, payload.actorId);
  }

  @MessagePattern(PATTERNS.CLINIC.UPDATE)
  async updateClinic(
    @Payload() payload: { id: string; data: UpdateClinicDto; actorId?: string },
  ) {
    return this.clinicService.updateClinic(
      payload.id,
      payload.data,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.UPDATE_STATUS)
  async updateStatus(
    @Payload()
    payload: {
      id: string;
      status: AccountStatus;
      reason?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.updateClinicStatus(
      payload.id,
      payload.status,
      payload.reason,
      payload.actorId,
    );
  }

  // ==========================================
  // CLINIC MANAGER OPERATIONS
  // ==========================================
  @MessagePattern(PATTERNS.CLINIC.MANAGER_GET_BRANCH)
  async getManagerBranch(
    @Payload() payload: { managerUserId: string; explicitClinicId?: string },
  ) {
    return this.clinicService.getClinicProfile(
      payload.managerUserId,
      payload.explicitClinicId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_UPDATE_BRANCH)
  async updateManagerBranch(
    @Payload()
    payload: {
      managerUserId: string;
      dto: UpdateClinicBranchProfileDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.updateClinicProfile(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_GET_STATS)
  async getManagerStats(
    @Payload() payload: { managerUserId: string; explicitClinicId?: string },
  ) {
    return this.clinicService.getClinicDashboardStats(
      payload.managerUserId,
      payload.explicitClinicId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_LIST_DOCTORS)
  async listDoctors(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicDoctorFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.listClinicDoctors(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_ASSIGN_DOCTOR)
  async assignDoctor(
    @Payload()
    payload: {
      managerUserId: string;
      dto: AssignDoctorToClinicDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.assignDoctorToClinic(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_REMOVE_DOCTOR)
  async removeDoctor(
    @Payload()
    payload: {
      managerUserId: string;
      doctorId: string;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.removeDoctorFromClinic(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.doctorId,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_LIST_STAFF)
  async listStaff(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicStaffFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.listClinicStaff(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_CREATE_STAFF)
  async createStaff(
    @Payload()
    payload: {
      managerUserId: string;
      dto: CreateClinicStaffDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.createClinicStaff(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_UPDATE_STAFF)
  async updateStaff(
    @Payload()
    payload: {
      managerUserId: string;
      staffId: string;
      dto: UpdateClinicStaffDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.updateClinicStaff(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.staffId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_DELETE_STAFF)
  async deleteStaff(
    @Payload()
    payload: {
      managerUserId: string;
      staffId: string;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.deleteClinicStaff(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.staffId,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_LIST_ROOMS)
  async listRooms(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicRoomFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.listClinicRooms(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_CREATE_ROOM)
  async createRoom(
    @Payload()
    payload: {
      managerUserId: string;
      dto: CreateClinicRoomDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.createClinicRoom(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_UPDATE_ROOM)
  async updateRoom(
    @Payload()
    payload: {
      managerUserId: string;
      roomId: string;
      dto: UpdateClinicRoomDto;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.updateClinicRoom(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.roomId,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_DELETE_ROOM)
  async deleteRoom(
    @Payload()
    payload: {
      managerUserId: string;
      roomId: string;
      explicitClinicId?: string;
      actorId?: string;
    },
  ) {
    return this.clinicService.deleteClinicRoom(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.roomId,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_LIST_APPOINTMENTS)
  async listAppointments(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicAppointmentFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.getClinicAppointments(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_LIST_QUEUE)
  async listQueue(
    @Payload() payload: { managerUserId: string; explicitClinicId?: string },
  ) {
    return this.clinicService.getClinicQueue(
      payload.managerUserId,
      payload.explicitClinicId,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_FINANCIALS)
  async getFinancials(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicFinancialFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.getClinicFinancialSummary(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.CLINIC.MANAGER_REPORTS)
  async getReports(
    @Payload()
    payload: {
      managerUserId: string;
      filter: ClinicReportFilterDto;
      explicitClinicId?: string;
    },
  ) {
    return this.clinicService.getClinicReports(
      payload.managerUserId,
      payload.explicitClinicId,
      payload.filter,
    );
  }
}
