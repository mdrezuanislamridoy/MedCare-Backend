import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from '../microservices/analytics/analytics.service';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../libs/auth/src';
import { UserRole } from '@medcare/contracts';

@ApiTags('Admin Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('admin/analytics')
export class AdminAnalyticsGatewayController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({
    summary:
      'Get clinic-wide or platform-wide analytical overview & performance metrics',
  })
  @ApiResponse({ status: 200, description: 'Analytics overview returned' })
  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getOverview() {
    return this.analyticsService.getOverview();
  }
}
