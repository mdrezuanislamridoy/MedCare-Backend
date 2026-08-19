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
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@medcare/shared';
import {
  ReceptionistCheckInDto,
  ReceptionistUpdateQueueDto,
  ReceptionistWalkInBookingDto,
} from '../../../../appointment-service/src/appointment/dto/appointment.dto';
import { PatientFilterDto } from '../../../../patient-service/src/patient/dto/patient.dto';

@ApiTags('Receptionist & Front-Desk')
@Controller('receptionist')
export class ReceptionistGatewayController {
  constructor(
    @Inject(MICROSERVICES.APPOINTMENT)
    private readonly appointmentClient: ClientProxy,
    @Inject(MICROSERVICES.DOCTOR)
    private readonly doctorClient: ClientProxy,
    @Inject(MICROSERVICES.PATIENT)
    private readonly patientClient: ClientProxy,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist dashboard summary' })
  @Get('dashboard')
  async getDashboard(@Query('clinicId') clinicId?: string) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_DASHBOARD,
      { clinicId },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist patient check-in' })
  @ApiBody({ type: ReceptionistCheckInDto })
  @Post('check-in')
  async checkIn(@Body() body: ReceptionistCheckInDto, @Req() req: any) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_CHECK_IN,
      { dto: body, actorId: req.user?.id },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist get live patient queue' })
  @Get('queue')
  async getQueue(
    @Query('clinicId') clinicId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_GET_QUEUE,
      { clinicId, doctorId },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist update queue status' })
  @ApiBody({ type: ReceptionistUpdateQueueDto })
  @Patch('queue/:id/status')
  async updateQueueStatus(
    @Param('id') id: string,
    @Body() body: ReceptionistUpdateQueueDto,
    @Req() req: any,
  ) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_UPDATE_QUEUE,
      { queueId: id, status: body.status, roomNumber: body.roomNumber, actorId: req.user?.id },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist walk-in appointment booking' })
  @ApiBody({ type: ReceptionistWalkInBookingDto })
  @Post('walk-in')
  async walkInBooking(@Body() body: ReceptionistWalkInBookingDto, @Req() req: any) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_WALK_IN,
      { dto: body, actorId: req.user?.id },
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.RECEPTIONIST,
    UserRole.CLINIC_MANAGER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Receptionist search patients' })
  @Get('patients/search')
  async searchPatients(@Query() query: PatientFilterDto) {
    return this.patientClient.send(PATTERNS.PATIENT.RECEPTIONIST_SEARCH, query);
  }

  @Public()
  @ApiOperation({ summary: 'Public TV Lobby Queue Display Board' })
  @Get('queue/display')
  async getDisplayBoard(@Query('clinicId') clinicId?: string) {
    return this.appointmentClient.send(
      PATTERNS.APPOINTMENT.RECEPTIONIST_GET_QUEUE,
      { clinicId },
    );
  }
}
