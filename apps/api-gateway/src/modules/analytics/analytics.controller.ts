import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard } from '../../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../../src/common/guards/roles.guard';
import { Roles, Public } from '../../../../../libs/auth/src';

@ApiTags('Platform Analytics & Overview')
@Controller()
export class AnalyticsGatewayController {
  constructor(
    @Inject(MICROSERVICES.ANALYTICS)
    private readonly analyticsClient: ClientProxy,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Get public platform statistics' })
  @Get('public/stats')
  async getPublicStats() {
    return this.analyticsClient.send(PATTERNS.ANALYTICS.GET_OVERVIEW, {});
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get analytics dashboard overview' })
  @Get('admin/analytics/overview')
  async getAdminOverview() {
    return this.analyticsClient.send(PATTERNS.ANALYTICS.GET_OVERVIEW, {});
  }
}
