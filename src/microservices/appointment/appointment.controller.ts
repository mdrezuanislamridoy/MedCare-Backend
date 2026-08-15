import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { AppointmentService } from './appointment.service';
import {
  AppointmentFilterDto,
  RescheduleAppointmentDto,
  TransitionAppointmentStatusDto,
  BookAppointmentDto,
  PatientAppointmentFilterDto,
} from './dto/appointment.dto';

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

  @MessagePattern(PATTERNS.APPOINTMENT.CANCEL)
  async cancel(@Payload() payload: { id: string; reason?: string; actorId?: string }) {
    return this.appointmentService.transitionStatus(
      payload.id,
      { status: 'CANCELLED' as any, cancellationReason: payload.reason },
      payload.actorId,
    );
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.APPOINTMENT.PATIENT_LIST)
  async patientList(@Payload() payload: { userId: string; filter: PatientAppointmentFilterDto }) {
    return this.appointmentService.patientListAppointments(payload.userId, payload.filter);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.PATIENT_GET_BY_ID)
  async patientGetById(@Payload() payload: { userId: string; appointmentId: string }) {
    return this.appointmentService.patientGetAppointment(payload.userId, payload.appointmentId);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.PATIENT_BOOK)
  async patientBook(@Payload() payload: { userId: string; dto: BookAppointmentDto }) {
    return this.appointmentService.patientBookAppointment(payload.userId, payload.dto);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.PATIENT_CANCEL)
  async patientCancel(@Payload() payload: { userId: string; appointmentId: string; reason?: string }) {
    return this.appointmentService.patientCancelAppointment(payload.userId, payload.appointmentId, payload.reason);
  }

  @MessagePattern(PATTERNS.APPOINTMENT.PATIENT_RESCHEDULE)
  async patientReschedule(@Payload() payload: { userId: string; appointmentId: string; dto: RescheduleAppointmentDto }) {
    return this.appointmentService.patientRescheduleAppointment(payload.userId, payload.appointmentId, payload.dto);
  }
}
