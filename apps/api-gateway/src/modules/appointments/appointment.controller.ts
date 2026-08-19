import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
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
  AppointmentFilterDto,
  BookAppointmentDto,
  PatientAppointmentFilterDto,
  RescheduleAppointmentDto,
  TransitionAppointmentStatusDto,
} from '../../../../appointment-service/src/appointment/dto/appointment.dto';

@ApiTags('Appointments & Scheduling')
@Controller()
export class AppointmentGatewayController {
  constructor(
    @Inject(MICROSERVICES.APPOINTMENT)
    private readonly appointmentClient: ClientProxy,
  ) {}

  // --- Admin Appointments ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all appointments' })
  @Get('admin/appointments')
  async adminListAppointments(@Query() query: AppointmentFilterDto) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.LIST, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin transition appointment status' })
  @ApiBody({ type: TransitionAppointmentStatusDto })
  @Patch('admin/appointments/:id/status')
  async adminTransitionStatus(
    @Param('id') id: string,
    @Body() body: TransitionAppointmentStatusDto,
    @Req() req: any,
  ) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.TRANSITION_STATUS, {
      id,
      dto: body,
      actorId: req.user?.id,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin reschedule appointment' })
  @ApiBody({ type: RescheduleAppointmentDto })
  @Patch('admin/appointments/:id/reschedule')
  async adminReschedule(
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
    @Req() req: any,
  ) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.RESCHEDULE, {
      id,
      dto: body,
      actorId: req.user?.id,
    });
  }

  // --- Patient Appointments ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient list appointments' })
  @Get('patient/appointments')
  async patientListAppointments(@Req() req: any, @Query() query: PatientAppointmentFilterDto) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.PATIENT_LIST, {
      userId: req.user.id,
      filter: query,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient book appointment' })
  @ApiBody({ type: BookAppointmentDto })
  @Post('patient/appointments')
  async patientBookAppointment(@Req() req: any, @Body() body: BookAppointmentDto) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.PATIENT_BOOK, {
      userId: req.user.id,
      dto: body,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient cancel appointment' })
  @Patch('patient/appointments/:id/cancel')
  async patientCancelAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentClient.send(PATTERNS.APPOINTMENT.PATIENT_CANCEL, {
      userId: req.user.id,
      appointmentId: id,
      reason,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient reschedule appointment' })
  @ApiBody({ type: RescheduleAppointmentDto })
  @Patch('patient/appointments/:id/reschedule')
  async patientRescheduleAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
  ) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.PATIENT_RESCHEDULE,
      {
        userId: req.user.id,
        appointmentId: id,
        dto: body,
      },
    );
  }
}
