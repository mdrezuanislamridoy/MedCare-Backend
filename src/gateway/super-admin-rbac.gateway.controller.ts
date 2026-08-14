import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { RbacService } from '../microservices/rbac/rbac.service';
import { AccessRequestFilterDto, CreateRoleDto, DecideAccessRequestDto, UpdateRolePermissionsDto } from '../microservices/rbac/dto/rbac.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('super-admin/rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminRbacGatewayController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('access-requests')
  async listAccessRequests(@Query() query: AccessRequestFilterDto) {
    return this.rbacService.listAccessRequests(query);
  }

  @Post('access-requests/:id/decision')
  async decideAccessRequest(
    @Param('id') id: string,
    @Body() body: DecideAccessRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.decideAccessRequest(id, body, req.user?.id);
  }

  @Get('matrix')
  async getMatrix() {
    return this.rbacService.getRolePermissionMatrix();
  }

  @Post('roles')
  async createRole(
    @Body() body: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.createRole(body, req.user?.id);
  }

  @Put('roles/:id/permissions')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: UpdateRolePermissionsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.updateRolePermissions(id, body, req.user?.id);
  }
}
