import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RbacService } from '../microservices/rbac/rbac.service';
import { AccessRequestFilterDto, CreateRoleDto, DecideAccessRequestDto, UpdateRolePermissionsDto } from '../microservices/rbac/dto/rbac.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Super Admin & RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin/rbac')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminRbacGatewayController {
  constructor(private readonly rbacService: RbacService) {}

  @ApiOperation({ summary: 'List privileged access requests' })
  @ApiResponse({ status: 200, description: 'Access requests returned' })
  @Get('access-requests')
  async listAccessRequests(@Query() query: AccessRequestFilterDto) {
    return this.rbacService.listAccessRequests(query);
  }

  @ApiOperation({ summary: 'Approve or reject elevated access request' })
  @ApiResponse({ status: 200, description: 'Decision processed' })
  @ApiParam({ name: 'id', description: 'Access Request ID' })
  @Post('access-requests/:id/decision')
  async decideAccessRequest(
    @Param('id') id: string,
    @Body() body: DecideAccessRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.decideAccessRequest(id, body, req.user?.id);
  }

  @ApiOperation({ summary: 'Get full RBAC role and permission matrix' })
  @ApiResponse({ status: 200, description: 'Role permission matrix returned' })
  @Get('matrix')
  async getMatrix() {
    return this.rbacService.getRolePermissionMatrix();
  }

  @ApiOperation({ summary: 'Create custom platform role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @Post('roles')
  async createRole(
    @Body() body: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.createRole(body, req.user?.id);
  }

  @ApiOperation({ summary: 'Update permissions mapped to a role' })
  @ApiResponse({ status: 200, description: 'Role permissions updated' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @Put('roles/:id/permissions')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: UpdateRolePermissionsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.updateRolePermissions(id, body, req.user?.id);
  }
}
