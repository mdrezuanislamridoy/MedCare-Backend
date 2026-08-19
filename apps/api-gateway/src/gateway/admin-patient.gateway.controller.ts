import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PatientService } from '../microservices/patient/patient.service';
import {
  PatientFilterDto,
  UpdatePatientStatusDto,
} from '../microservices/patient/dto/patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Admin Patient Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminPatientGatewayController {
  constructor(private readonly patientService: PatientService) {}

  @ApiOperation({ summary: 'List and search registered patients' })
  @ApiResponse({ status: 200, description: 'Paginated patients returned' })
  @Get()
  async listPatients(@Query() query: PatientFilterDto) {
    return this.patientService.listPatients(query);
  }

  @ApiOperation({
    summary: 'Get full patient details and consultation history',
  })
  @ApiResponse({ status: 200, description: 'Patient details returned' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @Get(':id')
  async getPatientById(@Param('id') id: string) {
    return this.patientService.getPatientById(id);
  }

  @ApiOperation({ summary: 'Update patient account status' })
  @ApiResponse({ status: 200, description: 'Account status updated' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.patientService.updatePatientStatus(
      id,
      body.status,
      body.reason,
      req.user?.id,
    );
  }
}
