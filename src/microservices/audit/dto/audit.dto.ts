export class AuditFilterDto {
  q?: string;
  actorId?: string;
  action?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class CreateAuditLogDto {
  actorId?: string;
  actorName!: string;
  action!: string;
  resource!: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  result?: string;
}
