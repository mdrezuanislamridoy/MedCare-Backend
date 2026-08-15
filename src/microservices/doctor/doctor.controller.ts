import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { DoctorService } from './doctor.service';
import { DoctorFilterDto, UpdateDoctorStatusDto, VerificationDecisionDto, PatientDoctorSearchDto } from './dto/doctor.dto';
import { VerificationStatus } from '../../../generated/prisma/client';

@Controller()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @MessagePattern(PATTERNS.DOCTOR.LIST)
  async listDoctors(@Payload() filter: DoctorFilterDto) {
    return this.doctorService.listDoctors(filter);
  }

  @MessagePattern(PATTERNS.DOCTOR.GET_BY_ID)
  async getDoctorById(@Payload() id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @MessagePattern(PATTERNS.DOCTOR.UPDATE_STATUS)
  async updateStatus(@Payload() payload: { id: string; dto: UpdateDoctorStatusDto; actorId?: string }) {
    return this.doctorService.updateDoctorStatus(payload.id, payload.dto.status, payload.dto.reason, payload.actorId);
  }

  @MessagePattern(PATTERNS.DOCTOR.LIST_VERIFICATIONS)
  async listVerifications(@Payload() payload: { status?: VerificationStatus }) {
    return this.doctorService.listVerificationQueue(payload?.status);
  }

  @MessagePattern(PATTERNS.DOCTOR.DECIDE_VERIFICATION)
  async decideVerification(@Payload() payload: { id: string; input: VerificationDecisionDto }) {
    return this.doctorService.decideVerification(payload.id, payload.input);
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_SEARCH)
  async patientSearch(@Payload() filter: PatientDoctorSearchDto) {
    return this.doctorService.patientSearchDoctors(filter);
  }

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_GET_DETAILS)
  async patientGetDetails(@Payload() payload: { id: string }) {
    return this.doctorService.patientGetDoctorDetails(payload.id);
  }

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_GET_SLOTS)
  async patientGetSlots(@Payload() payload: { doctorId: string; date: string }) {
    return this.doctorService.patientGetDoctorSlots(payload.doctorId, payload.date);
  }
}
