import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { AppointmentService } from '../microservices/appointment/appointment.service';
import {
  AppointmentFilterDto,
  RescheduleAppointmentDto,
  TransitionAppointmentStatusDto,
} from '../microservices/appointment/dto/appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Admin Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAppointmentGatewayController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @ApiOperation({ summary: 'List and filter all clinic appointments' })
  @ApiResponse({ status: 200, description: 'Appointments list returned' })
  @Get()
  async listAppointments(@Query() query: AppointmentFilterDto) {
    return this.appointmentService.listAppointments(query);
  }

  @ApiOperation({ summary: 'Get appointment details by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details returned' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Get(':id')
  async getAppointmentById(@Param('id') id: string) {
    return this.appointmentService.getAppointmentById(id);
  }

  @ApiOperation({
    summary:
      'Transition appointment status (CONFIRMED, CANCELLED, NO_SHOW, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Appointment status updated' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Patch(':id/status')
  async transitionStatus(
    @Param('id') id: string,
    @Body() body: TransitionAppointmentStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.transitionStatus(id, body, req.user?.id);
  }

  @ApiOperation({
    summary: 'Reschedule appointment to a new date/time or reassign doctor',
  })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Post(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.reschedule(id, body, req.user?.id);
  }
}
