import {
  Body,
  Controller,
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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@medcare/shared';

@ApiTags('Doctor Management & Clinical Operations')
@Controller()
export class DoctorGatewayController {
  constructor(
    @Inject(MICROSERVICES.DOCTOR) private readonly doctorClient: ClientProxy,
  ) {}

  // --- Public Doctor Search ---
  @Public()
  @ApiOperation({ summary: 'Public search for active doctors' })
  @Get('public/doctors')
  async publicSearchDoctors(@Query() query: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.PATIENT_SEARCH, query);
  }

  @Public()
  @ApiOperation({ summary: 'Public get doctor details' })
  @Get('public/doctors/:id')
  async publicGetDoctor(@Param('id') id: string) {
    return this.doctorClient.send(PATTERNS.DOCTOR.PATIENT_GET_DETAILS, id);
  }

  @Public()
  @ApiOperation({ summary: 'Public get doctor availability slots' })
  @Get('public/doctors/:id/slots')
  async publicGetDoctorSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    return this.doctorClient.send(PATTERNS.DOCTOR.PATIENT_GET_SLOTS, {
      id,
      date,
    });
  }

  // --- Admin Doctor Management ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all doctors' })
  @Get('admin/doctors')
  async adminListDoctors(@Query() query: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.LIST, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list doctor verification queue' })
  @Get('admin/doctors/verification-queue')
  async adminListVerifications(@Query('status') status?: string) {
    return this.doctorClient.send(PATTERNS.DOCTOR.LIST_VERIFICATIONS, {
      status,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin decide on doctor verification' })
  @Post('admin/doctors/verification-queue/:id/decision')
  async adminDecideVerification(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DECIDE_VERIFICATION, {
      id,
      dto: { ...body, adminId: req.user?.id },
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin update doctor status' })
  @Patch('admin/doctors/:id/status')
  async adminUpdateDoctorStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.doctorClient.send(PATTERNS.DOCTOR.UPDATE_STATUS, {
      id,
      status: body.status,
      reason: body.reason,
      actorId: req.user?.id,
    });
  }

  // --- Doctor Portal Operations ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor get dashboard summary' })
  @Get('doctor/dashboard')
  async doctorGetDashboard(@Req() req: any) {
    return this.doctorClient.send(
      PATTERNS.DOCTOR.DOCTOR_GET_DASHBOARD,
      req.user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor get profile' })
  @Get('doctor/profile')
  async doctorGetProfile(@Req() req: any) {
    return this.doctorClient.send(
      PATTERNS.DOCTOR.DOCTOR_GET_PROFILE,
      req.user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor update profile' })
  @Put('doctor/profile')
  async doctorUpdateProfile(@Req() req: any, @Body() body: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_UPDATE_PROFILE, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor get consultation workspace' })
  @Get('doctor/consultations/:appointmentId/workspace')
  async doctorGetWorkspace(
    @Req() req: any,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_GET_WORKSPACE, {
      userId: req.user.id,
      appointmentId,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor save consultation notes' })
  @Post('doctor/consultations/:appointmentId/notes')
  async doctorSaveNotes(
    @Req() req: any,
    @Param('appointmentId') appointmentId: string,
    @Body() body: any,
  ) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_SAVE_NOTES, {
      userId: req.user.id,
      appointmentId,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor complete consultation' })
  @Post('doctor/consultations/:appointmentId/complete')
  async doctorCompleteConsultation(
    @Req() req: any,
    @Param('appointmentId') appointmentId: string,
    @Body() body: any,
  ) {
    return this.doctorClient.send(
      PATTERNS.DOCTOR.DOCTOR_COMPLETE_CONSULTATION,
      {
        userId: req.user.id,
        appointmentId,
        dto: body,
      },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor issue prescription' })
  @Post('doctor/prescriptions')
  async doctorCreatePrescription(@Req() req: any, @Body() body: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_CREATE_PRESCRIPTION, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor get schedule' })
  @Get('doctor/schedules')
  async doctorGetSchedule(@Req() req: any) {
    return this.doctorClient.send(
      PATTERNS.DOCTOR.DOCTOR_GET_SCHEDULE,
      req.user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor update schedule' })
  @Post('doctor/schedules')
  async doctorUpdateSchedule(@Req() req: any, @Body() body: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_UPDATE_SCHEDULE, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor get earnings and payouts' })
  @Get('doctor/earnings')
  async doctorGetEarnings(@Req() req: any) {
    return this.doctorClient.send(
      PATTERNS.DOCTOR.DOCTOR_GET_EARNINGS,
      req.user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Doctor request payout disbursement' })
  @Post('doctor/payouts/request')
  async doctorRequestPayout(@Req() req: any, @Body() body: any) {
    return this.doctorClient.send(PATTERNS.DOCTOR.DOCTOR_REQUEST_PAYOUT, {
      userId: req.user.id,
      dto: body,
    });
  }
}
