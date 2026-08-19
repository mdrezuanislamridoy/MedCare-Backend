import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { PATTERNS, EVENTS } from '@medcare/contracts';
import { NotificationService } from './notification.service';
import {
  BroadcastNotificationDto,
  NotificationFilterDto,
} from './dto/notification.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(PATTERNS.NOTIFICATION.LIST)
  async listNotifications(@Payload() filter: NotificationFilterDto) {
    return this.notificationService.listNotifications(filter);
  }

  @MessagePattern(PATTERNS.NOTIFICATION.BROADCAST)
  async broadcast(
    @Payload() payload: { dto: BroadcastNotificationDto; senderId?: string },
  ) {
    return this.notificationService.broadcast(payload.dto, payload.senderId);
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.NOTIFICATION.PATIENT_LIST)
  async patientList(@Payload() payload: { userId: string }) {
    return this.notificationService.patientListNotifications(payload.userId);
  }

  @MessagePattern(PATTERNS.NOTIFICATION.PATIENT_MARK_READ)
  async patientMarkRead(
    @Payload() payload: { userId: string; notificationId: string },
  ) {
    return this.notificationService.patientMarkRead(
      payload.userId,
      payload.notificationId,
    );
  }

  @MessagePattern(PATTERNS.NOTIFICATION.PATIENT_MARK_ALL_READ)
  async patientMarkAllRead(@Payload() payload: { userId: string }) {
    return this.notificationService.patientMarkAllRead(payload.userId);
  }

  // --- Asynchronous Domain Event Patterns ---

  @EventPattern(EVENTS.APPOINTMENT.BOOKED)
  async handleAppointmentBooked(@Payload() data: any) {
    // Process async booking notification
    if (data?.patientId || data?.userId) {
      await this.notificationService.broadcast(
        {
          title: 'Appointment Confirmed',
          message: `Your appointment with Dr. ${data.doctorName || 'Specialist'} has been confirmed for ${data.date || 'the scheduled date'}.`,
        },
        'SYSTEM',
      );
    }
  }

  @EventPattern(EVENTS.PAYMENT.SUCCESS)
  async handlePaymentSuccess(@Payload() data: any) {
    await this.notificationService.broadcast(
      {
        title: 'Payment Successful',
        message: `Payment of $${data.amount || 0} received successfully for Invoice #${data.invoiceNumber || 'N/A'}.`,
      },
      'SYSTEM',
    );
  }

  @EventPattern(EVENTS.NOTIFICATION.DISPATCH)
  async handleNotificationDispatch(@Payload() data: BroadcastNotificationDto) {
    await this.notificationService.broadcast(data, 'EVENT_BUS');
  }
}
