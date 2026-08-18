import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from '../microservices/audit/audit.service';
import { AuditFilterDto } from '../microservices/audit/dto/audit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@ApiTags('Admin Audit Logs')
@ApiBearerAuth('JWT-auth')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAuditGatewayController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({
    summary: 'List and search security and operational audit trail logs',
  })
  @ApiResponse({ status: 200, description: 'Audit logs returned' })
  @Get()
  async listLogs(@Query() query: AuditFilterDto) {
    return this.auditService.listLogs(query);
  }
}
