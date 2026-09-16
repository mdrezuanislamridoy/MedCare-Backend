import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { firstValueFrom, timeout } from 'rxjs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles } from '@medcare/shared';
import {
  CreateMedicalRecordDto,
  PatientFilterDto,
  UpdatePatientProfileDto,
  UpdatePatientStatusDto,
} from '../../../../patient-service/src/patient/dto/patient.dto';
import { SubmitReviewDto } from '../../../../doctor-service/src/doctor/dto/doctor.dto';

@ApiTags('Patient Portal & Records')
@Controller()
export class PatientGatewayController {
  constructor(
    @Inject(MICROSERVICES.PATIENT) private readonly patientClient: ClientProxy,
    @Inject(MICROSERVICES.DOCTOR) private readonly doctorClient: ClientProxy,
    @Inject(MICROSERVICES.APPOINTMENT)
    private readonly appointmentClient: ClientProxy,
  ) {}

  // --- Admin Patient Management ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all patients' })
  @Get('admin/patients')
  async adminListPatients(@Query() query: PatientFilterDto) {
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
  @ApiBody({ type: UpdatePatientStatusDto })
  @Patch('admin/patients/:id/status')
  async adminUpdateStatus(
    @Param('id') id: string,
    @Body() body: UpdatePatientStatusDto,
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
  @ApiBody({ type: UpdatePatientProfileDto })
  @Put('patient/profile')
  async patientUpdateProfile(
    @Req() req: any,
    @Body() body: UpdatePatientProfileDto,
  ) {
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
  async patientListRecords(
    @Req() req: any,
    @Query('category') category?: string,
  ) {
    return this.patientClient.send(PATTERNS.PATIENT.LIST_RECORDS, {
      userId: req.user.id,
      category,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient save diagnostic record' })
  @ApiBody({ type: CreateMedicalRecordDto })
  @Post('patient/medical-records')
  async patientCreateRecord(
    @Req() req: any,
    @Body() body: CreateMedicalRecordDto,
  ) {
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
    return this.patientClient.send(
      PATTERNS.PATIENT.LIST_PRESCRIPTIONS,
      req.user.id,
    );
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

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient list reviews they have submitted' })
  @Get('patient/reviews')
  async patientListReviews(@Req() req: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.PATIENT_LIST_REVIEWS, {
      patientId: req.user.id,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient submit a review for a completed appointment' })
  @ApiBody({ type: SubmitReviewDto })
  @Post('patient/reviews')
  async patientSubmitReview(@Req() req: any, @Body() body: SubmitReviewDto) {
    const appointment: any = await firstValueFrom(
      this.appointmentClient
        .send(PATTERNS.APPOINTMENT.PATIENT_GET_BY_ID, {
          userId: req.user.id,
          appointmentId: body.appointmentId,
        })
        .pipe(timeout(5000)),
    );

    if (!appointment || appointment.patientId !== req.user.id) {
      throw new ForbiddenException('You can only review your own appointments');
    }
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'You can only review appointments that have been completed',
      );
    }

    return this.doctorClient.send(PATTERNS.DOCTOR.SUBMIT_REVIEW, {
      patientId: req.user.id,
      patientName: appointment.patientName || 'Anonymous Patient',
      doctorId: appointment.doctorId,
      dto: body,
    });
  }
}
