import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from '../microservices/notification/notification.service';
import { BroadcastNotificationDto, NotificationFilterDto } from '../microservices/notification/dto/notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminNotificationGatewayController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async listNotifications(@Query() query: NotificationFilterDto) {
    return this.notificationService.listNotifications(query);
  }

  @Post('broadcast')
  async broadcast(
    @Body() body: BroadcastNotificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.broadcast(body, req.user?.id);
  }
}
