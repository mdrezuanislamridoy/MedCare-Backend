import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from '../microservices/system/system.service';
import { TriggerBackupDto, UpdatePlatformSettingsDto } from '../microservices/system/dto/system.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Super Admin System & Health')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminSystemGatewayController {
  constructor(private readonly systemService: SystemService) {}

  @ApiOperation({ summary: 'Get microservices status and database health check' })
  @ApiResponse({ status: 200, description: 'System health state returned' })
  @Get('health')
  async getHealth() {
    return this.systemService.getHealth();
  }

  @ApiOperation({ summary: 'Get platform-wide configuration settings' })
  @ApiResponse({ status: 200, description: 'Settings dictionary returned' })
  @Get('settings')
  async getSettings() {
    return this.systemService.getSettings();
  }

  @ApiOperation({ summary: 'Update platform-wide settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @Put('settings')
  async updateSettings(
    @Body() body: UpdatePlatformSettingsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.systemService.updateSettings(body.settings, req.user?.id);
  }

  @ApiOperation({ summary: 'Trigger manual database and system backup snapshot' })
  @ApiResponse({ status: 201, description: 'Backup job triggered' })
  @Post('backup')
  async triggerBackup(
    @Body() body: TriggerBackupDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.systemService.triggerBackup(req.user?.id, body.notes);
  }
}
