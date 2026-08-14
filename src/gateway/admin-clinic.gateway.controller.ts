import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ClinicService } from '../microservices/clinic/clinic.service';
import { ClinicFilterDto, CreateClinicDto, UpdateClinicDto, UpdateClinicStatusDto } from '../microservices/clinic/dto/clinic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminClinicGatewayController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get()
  async listClinics(@Query() query: ClinicFilterDto) {
    return this.clinicService.listClinics(query);
  }

  @Get(':id')
  async getClinicById(@Param('id') id: string) {
    return this.clinicService.getClinicById(id);
  }

  @Post()
  async createClinic(
    @Body() body: CreateClinicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.createClinic(body, req.user?.id);
  }

  @Put(':id')
  async updateClinic(
    @Param('id') id: string,
    @Body() body: UpdateClinicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.updateClinic(id, body, req.user?.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateClinicStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.updateClinicStatus(id, body.status, body.reason, req.user?.id);
  }
}
