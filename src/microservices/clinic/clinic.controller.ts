import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { ClinicService } from './clinic.service';
import { ClinicFilterDto, CreateClinicDto, UpdateClinicDto } from './dto/clinic.dto';
import { AccountStatus } from '../../../generated/prisma/client';

@Controller()
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @MessagePattern(PATTERNS.CLINIC.LIST)
  async listClinics(@Payload() filter: ClinicFilterDto) {
    return this.clinicService.listClinics(filter);
  }

  @MessagePattern(PATTERNS.CLINIC.CREATE)
  async createClinic(@Payload() payload: { data: CreateClinicDto; actorId?: string }) {
    return this.clinicService.createClinic(payload.data, payload.actorId);
  }

  @MessagePattern(PATTERNS.CLINIC.UPDATE)
  async updateClinic(@Payload() payload: { id: string; data: UpdateClinicDto; actorId?: string }) {
    return this.clinicService.updateClinic(payload.id, payload.data, payload.actorId);
  }

  @MessagePattern(PATTERNS.CLINIC.UPDATE_STATUS)
  async updateStatus(@Payload() payload: { id: string; status: AccountStatus; reason?: string; actorId?: string }) {
    return this.clinicService.updateClinicStatus(payload.id, payload.status, payload.reason, payload.actorId);
  }
}
