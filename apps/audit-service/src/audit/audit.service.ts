import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { AuditFilterDto, CreateAuditLogDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async listLogs(filter: AuditFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.actorId) {
      where.actorId = filter.actorId;
    }
    if (filter.action) {
      where.action = { contains: filter.action, mode: 'insensitive' };
    }
    if (filter.result) {
      where.result = filter.result;
    }
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }
    if (filter.q) {
      where.OR = [
        { actorName: { contains: filter.q, mode: 'insensitive' } },
        { action: { contains: filter.q, mode: 'insensitive' } },
        { resource: { contains: filter.q, mode: 'insensitive' } },
        { ipAddress: { contains: filter.q, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recordLog(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        actorId: dto.actorId,
        actorName: dto.actorName,
        action: dto.action,
        resource: dto.resource,
        details: dto.details,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        result: dto.result || 'success',
      },
    });
  }
}
