import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS, AccountStatus, RecordCategory } from '@medcare/contracts';
import { PatientService } from './patient.service';
import {
  PatientFilterDto,
  UpdatePatientProfileDto,
  CreateMedicalRecordDto,
} from './dto/patient.dto';

@Controller()
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @MessagePattern(PATTERNS.PATIENT.LIST)
  async listPatients(@Payload() filter: PatientFilterDto) {
    return this.patientService.listPatients(filter);
  }

  @MessagePattern(PATTERNS.PATIENT.GET_BY_ID)
  async getPatientById(@Payload() id: string) {
    return this.patientService.getPatientById(id);
  }

  @MessagePattern(PATTERNS.PATIENT.UPDATE_STATUS)
  async updateStatus(
    @Payload()
    payload: {
      id: string;
      status: AccountStatus;
      reason?: string;
      actorId?: string;
    },
  ) {
    return this.patientService.updatePatientStatus(
      payload.id,
      payload.status,
      payload.reason,
      payload.actorId,
    );
  }

  // --- Patient Portal Endpoints ---

  @MessagePattern(PATTERNS.PATIENT.GET_DASHBOARD)
  async getDashboard(@Payload() payload: { userId: string }) {
    return this.patientService.getDashboardSummary(payload.userId);
  }

  @MessagePattern(PATTERNS.PATIENT.GET_PROFILE)
  async getProfile(@Payload() payload: { userId: string }) {
    return this.patientService.getProfile(payload.userId);
  }

  @MessagePattern(PATTERNS.PATIENT.UPDATE_PROFILE)
  async updateProfile(
    @Payload() payload: { userId: string; data: UpdatePatientProfileDto },
  ) {
    return this.patientService.updateProfile(payload.userId, payload.data);
  }

  @MessagePattern(PATTERNS.PATIENT.LIST_RECORDS)
  async listMedicalRecords(
    @Payload() payload: { userId: string; category?: RecordCategory },
  ) {
    return this.patientService.listMedicalRecords(
      payload.userId,
      payload.category,
    );
  }

  @MessagePattern(PATTERNS.PATIENT.CREATE_RECORD)
  async createMedicalRecord(
    @Payload() payload: { userId: string; data: CreateMedicalRecordDto },
  ) {
    return this.patientService.createMedicalRecord(
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern(PATTERNS.PATIENT.DELETE_RECORD)
  async deleteMedicalRecord(
    @Payload() payload: { userId: string; recordId: string },
  ) {
    return this.patientService.deleteMedicalRecord(
      payload.userId,
      payload.recordId,
    );
  }

  @MessagePattern(PATTERNS.PATIENT.LIST_PRESCRIPTIONS)
  async listPrescriptions(@Payload() payload: { userId: string }) {
    return this.patientService.listPrescriptions(payload.userId);
  }

  @MessagePattern(PATTERNS.PATIENT.GET_PRESCRIPTION)
  async getPrescription(
    @Payload() payload: { userId: string; prescriptionId: string },
  ) {
    return this.patientService.getPrescriptionById(
      payload.userId,
      payload.prescriptionId,
    );
  }

  // --- Receptionist Portal Endpoints ---

  @MessagePattern(PATTERNS.PATIENT.RECEPTIONIST_SEARCH)
  async receptionistSearch(
    @Payload() payload: { q?: string; page?: number; limit?: number },
  ) {
    return this.patientService.receptionistSearchPatients(
      payload?.q,
      payload?.page,
      payload?.limit,
    );
  }
}
