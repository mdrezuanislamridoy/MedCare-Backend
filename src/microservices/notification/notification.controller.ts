import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { NotificationService } from './notification.service';
import { BroadcastNotificationDto, NotificationFilterDto } from './dto/notification.dto';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(PATTERNS.NOTIFICATION.LIST)
  async listNotifications(@Payload() filter: NotificationFilterDto) {
    return this.notificationService.listNotifications(filter);
  }

  @MessagePattern(PATTERNS.NOTIFICATION.BROADCAST)
  async broadcast(@Payload() payload: { dto: BroadcastNotificationDto; senderId?: string }) {
    return this.notificationService.broadcast(payload.dto, payload.senderId);
  }
}
