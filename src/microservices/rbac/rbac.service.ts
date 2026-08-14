import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';
import { AccessRequestFilterDto, CreateRoleDto, DecideAccessRequestDto, UpdateRolePermissionsDto } from './dto/rbac.dto';
import { AccessRequestStatus } from '../../../generated/prisma/client';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccessRequests(filter: AccessRequestFilterDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.status) {
      where.status = filter.status;
    }

    const [requests, total] = await Promise.all([
      this.prisma.accessRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.accessRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async decideAccessRequest(id: string, dto: DecideAccessRequestDto, superAdminId?: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Access request with ID ${id} not found`);
    }

    const status: AccessRequestStatus =
      dto.decision === 'APPROVED' ? AccessRequestStatus.APPROVED : AccessRequestStatus.REJECTED;

    const updated = await this.prisma.accessRequest.update({
      where: { id },
      data: {
        status,
        notes: dto.notes,
        reviewedBy: superAdminId,
        reviewedAt: new Date(),
      },
    });

    if (dto.decision === 'APPROVED') {
      await this.prisma.user.upsert({
        where: { email: request.email },
        update: {
          role: request.role,
          name: request.name,
        },
        create: {
          email: request.email,
          name: request.name,
          role: request.role,
        },
      }).catch(() => null);
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        actorName: 'Super Admin',
        action: `Access Request ${dto.decision}`,
        resource: `User Request: ${request.name} (${request.email}) -> Role: ${request.role}`,
        details: JSON.stringify(dto),
        result: 'success',
      },
    }).catch(() => null);

    return updated;
  }

  async getRolePermissionMatrix() {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      }),
      this.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      }),
    ]);

    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissionActions: role.permissions.map((p) => p.permission.action),
      })),
      allPermissions: permissions,
    };
  }

  async createRole(dto: CreateRoleDto, superAdminId?: string) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Role with name ${dto.name} already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((pId) => ({
                permission: { connect: { id: pId } },
              })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        actorName: 'Super Admin',
        action: 'Custom Role Created',
        resource: `Role ${role.name}`,
        details: JSON.stringify(dto),
        result: 'success',
      },
    }).catch(() => null);

    return role;
  }

  async updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto, superAdminId?: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Re-create assigned permissions
    if (dto.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: superAdminId,
        actorName: 'Super Admin',
        action: `Role Permissions Updated for ${role.name}`,
        resource: `Role ID: ${roleId}`,
        details: JSON.stringify(dto),
        result: 'success',
      },
    }).catch(() => null);

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
  }
}
