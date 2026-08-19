import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard } from '../../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../../libs/auth/src';

@ApiTags('Notifications & Announcements')
@Controller()
export class NotificationGatewayController {
  constructor(
    @Inject(MICROSERVICES.NOTIFICATION)
    private readonly notificationClient: ClientProxy,
  ) {}

  // --- Admin Notifications ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all broadcast notifications' })
  @Get('admin/notifications')
  async adminListNotifications(@Query() query: any) {
    return this.notificationClient.send(PATTERNS.NOTIFICATION.LIST, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin send broadcast announcement' })
  @Post('admin/notifications/broadcast')
  async adminBroadcast(@Body() body: any, @Req() req: any) {
    return this.notificationClient.send(PATTERNS.NOTIFICATION.BROADCAST, {
      dto: body,
      senderId: req.user?.id,
    });
  }

  // --- Patient Notifications ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient list notifications' })
  @Get('patient/notifications')
  async patientListNotifications(@Req() req: any) {
    return this.notificationClient.send(
      PATTERNS.NOTIFICATION.PATIENT_LIST,
      req.user.id,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient mark notification as read' })
  @Patch('patient/notifications/:id/read')
  async patientMarkRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationClient.send(PATTERNS.NOTIFICATION.PATIENT_MARK_READ, {
      userId: req.user.id,
      notificationId: id,
    });
  }
}
