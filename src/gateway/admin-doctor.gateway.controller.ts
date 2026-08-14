import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { DoctorFilterDto, VerificationDecisionDto, UpdateDoctorStatusDto } from '../microservices/doctor/dto/doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, VerificationStatus } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminDoctorGatewayController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  async listDoctors(@Query() query: DoctorFilterDto) {
    return this.doctorService.listDoctors(query);
  }

  @Get('verification-queue')
  async listVerificationQueue(@Query('status') status?: VerificationStatus) {
    return this.doctorService.listVerificationQueue(status);
  }

  @Post('verification-queue/:id/decision')
  async decideVerification(
    @Param('id') id: string,
    @Body() body: VerificationDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.doctorService.decideVerification(id, {
      ...body,
      adminId: req.user?.id,
    });
  }

  @Get(':id')
  async getDoctorById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDoctorStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.doctorService.updateDoctorStatus(id, body.status, body.reason, req.user?.id);
  }
}
