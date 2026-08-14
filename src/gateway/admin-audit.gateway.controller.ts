import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../microservices/audit/audit.service';
import { AuditFilterDto } from '../microservices/audit/dto/audit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAuditGatewayController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async listLogs(@Query() query: AuditFilterDto) {
    return this.auditService.listLogs(query);
  }
}
