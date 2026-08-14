import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { DoctorService } from './doctor.service';
import { DoctorFilterDto, VerificationDecisionDto, UpdateDoctorStatusDto } from './dto/doctor.dto';
import { AccountStatus, VerificationStatus } from '../../../generated/prisma/client';


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
  async updateStatus(@Payload() payload: { id: string; status: AccountStatus; reason?: string; actorId?: string }) {
    return this.doctorService.updateDoctorStatus(payload.id, payload.status, payload.reason, payload.actorId);
  }

  @MessagePattern(PATTERNS.DOCTOR.LIST_VERIFICATIONS)
  async listVerifications(@Payload() payload: { status?: VerificationStatus }) {
    return this.doctorService.listVerificationQueue(payload?.status);
  }

  @MessagePattern(PATTERNS.DOCTOR.DECIDE_VERIFICATION)
  async decideVerification(@Payload() payload: { id: string; input: VerificationDecisionDto }) {
    return this.doctorService.decideVerification(payload.id, payload.input);
  }
}
