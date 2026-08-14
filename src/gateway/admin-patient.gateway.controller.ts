import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { PatientService } from '../microservices/patient/patient.service';
import { PatientFilterDto, UpdatePatientStatusDto } from '../microservices/patient/dto/patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminPatientGatewayController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  async listPatients(@Query() query: PatientFilterDto) {
    return this.patientService.listPatients(query);
  }

  @Get(':id')
  async getPatientById(@Param('id') id: string) {
    return this.patientService.getPatientById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.patientService.updatePatientStatus(id, body.status, body.reason, req.user?.id);
  }
}
