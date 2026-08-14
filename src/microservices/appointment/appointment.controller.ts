import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { AppointmentService } from './appointment.service';
import { AppointmentFilterDto, RescheduleAppointmentDto, TransitionAppointmentStatusDto } from './dto/appointment.dto';

@Controller()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @MessagePattern(PATTERNS.APPOINTMENT.LIST)
  async listAppointments(@Payload() filter: AppointmentFilterDto) {
    return this.appointmentService.listAppointments(filter);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.TRANSITION_STATUS)
  async transitionStatus(@Payload() payload: { id: string; dto: TransitionAppointmentStatusDto; actorId?: string }) {
    return this.appointmentService.transitionStatus(payload.id, payload.dto, payload.actorId);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.RESCHEDULE)
  async reschedule(@Payload() payload: { id: string; dto: RescheduleAppointmentDto; actorId?: string }) {
    return this.appointmentService.reschedule(payload.id, payload.dto, payload.actorId);
  }
}
