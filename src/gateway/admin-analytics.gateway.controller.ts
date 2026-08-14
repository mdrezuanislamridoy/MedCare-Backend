import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../microservices/analytics/analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@Controller('admin/analytics')
export class AdminAnalyticsGatewayController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getOverview() {
    return this.analyticsService.getOverview();
  }
}
