import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard } from '../../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../../libs/auth/src';

@ApiTags('Patient Portal & Records')
@Controller()
export class PatientGatewayController {
  constructor(
    @Inject(MICROSERVICES.PATIENT) private readonly patientClient: ClientProxy,
  ) {}

  // --- Admin Patient Management ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all patients' })
  @Get('admin/patients')
  async adminListPatients(@Query() query: any) {
    return this.patientClient.send(PATTERNS.PATIENT.LIST, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get patient profile by ID' })
  @Get('admin/patients/:id')
  async adminGetPatient(@Param('id') id: string) {
    return this.patientClient.send(PATTERNS.PATIENT.GET_BY_ID, id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin update patient status' })
  @Patch('admin/patients/:id/status')
  async adminUpdateStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.patientClient.send(PATTERNS.PATIENT.UPDATE_STATUS, {
      id,
      status: body.status,
      reason: body.reason,
      actorId: req.user?.id,
    });
  }

  // --- Patient Portal Self-Service ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient get dashboard summary' })
  @Get('patient/dashboard')
  async patientGetDashboard(@Req() req: any) {
    return this.patientClient.send(PATTERNS.PATIENT.GET_DASHBOARD, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient get health profile' })
  @Get('patient/profile')
  async patientGetProfile(@Req() req: any) {
    return this.patientClient.send(PATTERNS.PATIENT.GET_PROFILE, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient update health profile' })
  @Put('patient/profile')
  async patientUpdateProfile(@Req() req: any, @Body() body: any) {
    return this.patientClient.send(PATTERNS.PATIENT.UPDATE_PROFILE, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient list diagnostic records' })
  @Get('patient/medical-records')
  async patientListRecords(@Req() req: any, @Query('category') category?: string) {
    return this.patientClient.send(PATTERNS.PATIENT.LIST_RECORDS, {
      userId: req.user.id,
      category,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient save diagnostic record' })
  @Post('patient/medical-records')
  async patientCreateRecord(@Req() req: any, @Body() body: any) {
    return this.patientClient.send(PATTERNS.PATIENT.CREATE_RECORD, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient delete diagnostic record' })
  @Delete('patient/medical-records/:id')
  async patientDeleteRecord(@Req() req: any, @Param('id') id: string) {
    return this.patientClient.send(PATTERNS.PATIENT.DELETE_RECORD, {
      userId: req.user.id,
      recordId: id,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient list prescriptions' })
  @Get('patient/prescriptions')
  async patientListPrescriptions(@Req() req: any) {
    return this.patientClient.send(PATTERNS.PATIENT.LIST_PRESCRIPTIONS, req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient get prescription details' })
  @Get('patient/prescriptions/:id')
  async patientGetPrescription(@Req() req: any, @Param('id') id: string) {
    return this.patientClient.send(PATTERNS.PATIENT.GET_PRESCRIPTION, {
      userId: req.user.id,
      prescriptionId: id,
    });
  }
}
