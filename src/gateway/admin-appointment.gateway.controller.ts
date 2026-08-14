import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppointmentService } from '../microservices/appointment/appointment.service';
import { AppointmentFilterDto, RescheduleAppointmentDto, TransitionAppointmentStatusDto } from '../microservices/appointment/dto/appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAppointmentGatewayController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  async listAppointments(@Query() query: AppointmentFilterDto) {
    return this.appointmentService.listAppointments(query);
  }

  @Get(':id')
  async getAppointmentById(@Param('id') id: string) {
    return this.appointmentService.getAppointmentById(id);
  }

  @Patch(':id/status')
  async transitionStatus(
    @Param('id') id: string,
    @Body() body: TransitionAppointmentStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.transitionStatus(id, body, req.user?.id);
  }

  @Post(':id/reschedule')
  async reschedule(
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.appointmentService.reschedule(id, body, req.user?.id);
  }
}
