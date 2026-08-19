import {
  Body,
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { NotificationService } from '../microservices/notification/notification.service';
import {
  BroadcastNotificationDto,
  NotificationFilterDto,
} from '../../../notification-service/src/notification/dto/notification.dto';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../libs/auth/src';
import { UserRole } from '@medcare/contracts';
import type { AuthenticatedRequest } from '../../../../src/common/types/authenticated-request.type';

@ApiTags('Admin Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminNotificationGatewayController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({ summary: 'List and filter platform system notifications' })
  @ApiResponse({ status: 200, description: 'Notifications list returned' })
  @Get()
  async listNotifications(@Query() query: NotificationFilterDto) {
    return this.notificationService.listNotifications(query);
  }

  @ApiOperation({ summary: 'Broadcast targeted or system-wide notification' })
  @ApiResponse({ status: 201, description: 'Notification broadcasted' })
  @Post('broadcast')
  async broadcast(
    @Body() body: BroadcastNotificationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.notificationService.broadcast(body, req.user?.id);
  }
}
