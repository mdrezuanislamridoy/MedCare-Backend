import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { PatientService } from './patient.service';
import { PatientFilterDto } from './dto/patient.dto';
import { AccountStatus } from '../../../generated/prisma/client';

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
  async updateStatus(@Payload() payload: { id: string; status: AccountStatus; reason?: string; actorId?: string }) {
    return this.patientService.updatePatientStatus(payload.id, payload.status, payload.reason, payload.actorId);
  }
}
