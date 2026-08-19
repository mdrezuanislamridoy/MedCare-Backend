import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '@medcare/contracts';

@Controller()
export class DoctorEventConsumer {
  private readonly logger = new Logger(DoctorEventConsumer.name);

  @EventPattern(EVENTS.APPOINTMENT.COMPLETED)
  async handleAppointmentCompleted(@Payload() data: any) {
    this.logger.log(`Received APPOINTMENT.COMPLETED event for doctor consultation: ${JSON.stringify(data)}`);
  }
}
