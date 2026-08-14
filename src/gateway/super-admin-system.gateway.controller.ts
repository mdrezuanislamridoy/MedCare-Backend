import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SystemService } from '../microservices/system/system.service';
import { TriggerBackupDto, UpdatePlatformSettingsDto } from '../microservices/system/dto/system.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('super-admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminSystemGatewayController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getHealth() {
    return this.systemService.getHealth();
  }

  @Get('settings')
  async getSettings() {
    return this.systemService.getSettings();
  }

  @Put('settings')
  async updateSettings(
    @Body() body: UpdatePlatformSettingsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.systemService.updateSettings(body.settings, req.user?.id);
  }

  @Post('backup')
  async triggerBackup(
    @Body() body: TriggerBackupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.systemService.triggerBackup(req.user?.id, body.notes);
  }
}
