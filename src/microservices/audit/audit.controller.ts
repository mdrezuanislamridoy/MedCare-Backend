import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS, EVENTS } from '../common/microservices.constants';
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
  @EventPattern(EVENTS.AUDIT.RECORD)
  async recordLog(@Payload() dto: CreateAuditLogDto) {
    return this.auditService.recordLog(dto);
  }

  @MessagePattern(PATTERNS.AUDIT.RECEPTIONIST_LOGS)
  async listReceptionistLogs(@Payload() payload: { limit?: number }) {
    return this.auditService.listLogs({
      limit: payload?.limit || 20,
      q: 'Receptionist',
    });
  }
}
