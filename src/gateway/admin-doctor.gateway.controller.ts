import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { DoctorFilterDto, VerificationDecisionDto, UpdateDoctorStatusDto } from '../microservices/doctor/dto/doctor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, VerificationStatus } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Admin Doctor Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminDoctorGatewayController {
  constructor(private readonly doctorService: DoctorService) {}

  @ApiOperation({ summary: 'List and filter all registered doctors across clinics' })
  @ApiResponse({ status: 200, description: 'Paginated doctors list returned' })
  @Get()
  async listDoctors(@Query() query: DoctorFilterDto) {
    return this.doctorService.listDoctors(query);
  }

  @ApiOperation({ summary: 'List doctor license verification applications queue' })
  @ApiResponse({ status: 200, description: 'Verification queue returned' })
  @ApiQuery({ name: 'status', enum: VerificationStatus, required: false })
  @Get('verification-queue')
  async listVerificationQueue(@Query('status') status?: VerificationStatus) {
    return this.doctorService.listVerificationQueue(status);
  }

  @ApiOperation({ summary: 'Approve, reject, or request documents for doctor verification' })
  @ApiResponse({ status: 200, description: 'Decision recorded and doctor notified' })
  @ApiParam({ name: 'id', description: 'Doctor Verification ID' })
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

  @ApiOperation({ summary: 'Get complete doctor profile by ID' })
  @ApiResponse({ status: 200, description: 'Doctor details returned' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @Get(':id')
  async getDoctorById(@Param('id') id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @ApiOperation({ summary: 'Update doctor account status (ACTIVE, SUSPENDED, INACTIVE)' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiParam({ name: 'id', description: 'Doctor ID' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateDoctorStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.doctorService.updateDoctorStatus(id, body.status, body.reason, req.user?.id);
  }
}
