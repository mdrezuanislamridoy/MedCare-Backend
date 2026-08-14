import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { AuditService } from './audit.service';
import { AuditFilterDto, CreateAuditLogDto } from './dto/audit.dto';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @MessagePattern(PATTERNS.AUDIT.LIST)
  async listLogs(@Payload() filter: AuditFilterDto) {
    return this.auditService.listLogs(filter);
  }

  @EventPattern(PATTERNS.AUDIT.LOG_EVENT)
  async recordLog(@Payload() dto: CreateAuditLogDto) {
    return this.auditService.recordLog(dto);
  }
}
