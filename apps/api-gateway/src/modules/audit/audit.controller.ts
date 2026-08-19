import {
  Controller,
  Get,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles } from '@medcare/shared';

@ApiTags('Audit Logs & Compliance')
@Controller()
export class AuditGatewayController {
  constructor(
    @Inject(MICROSERVICES.AUDIT) private readonly auditClient: ClientProxy,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list audit security logs' })
  @Get('admin/audit-logs')
  async adminListLogs(@Query() query: any) {
    return this.auditClient.send(PATTERNS.AUDIT.LIST, query);
  }
}
