import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EVENTS } from '../../../../libs/contracts/src';

@Controller()
export class AppointmentEventConsumer {
  private readonly logger = new Logger(AppointmentEventConsumer.name);

  @EventPattern(EVENTS.PAYMENT.SUCCESS)
  async handlePaymentSuccess(@Payload() data: any) {
    this.logger.log(`Received PAYMENT.SUCCESS event for appointment confirmation: ${JSON.stringify(data)}`);
  }
}
