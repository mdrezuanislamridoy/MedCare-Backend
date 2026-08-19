import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RbacService } from '../microservices/rbac/rbac.service';
import {
  AccessRequestFilterDto,
  CreateRoleDto,
  DecideAccessRequestDto,
  UpdateRolePermissionsDto,
  AdministratorFilterDto,
  CreateAdministratorDto,
  UpdateAdministratorStatusDto,
} from '../microservices/rbac/dto/rbac.dto';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../libs/auth/src';
import { UserRole } from '@medcare/contracts';
import type { AuthenticatedRequest } from '../../../../src/common/types/authenticated-request.type';

@ApiTags('Super Admin & RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminRbacGatewayController {
  constructor(private readonly rbacService: RbacService) {}

  // ==========================================
  // 1. PRIVILEGED ACCESS REQUESTS
  // ==========================================
  @ApiOperation({ summary: 'List privileged access requests' })
  @ApiResponse({ status: 200, description: 'Access requests returned' })
  @Get('rbac/access-requests')
  async listAccessRequests(@Query() query: AccessRequestFilterDto) {
    return this.rbacService.listAccessRequests(query);
  }

  @ApiOperation({ summary: 'Approve or reject elevated access request' })
  @ApiResponse({ status: 200, description: 'Decision processed' })
  @ApiParam({ name: 'id', description: 'Access Request ID' })
  @Post('rbac/access-requests/:id/decision')
  async decideAccessRequest(
    @Param('id') id: string,
    @Body() body: DecideAccessRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.decideAccessRequest(id, body, req.user?.id);
  }

  // ==========================================
  // 2. RBAC ROLE & PERMISSION MATRIX
  // ==========================================
  @ApiOperation({ summary: 'Get full RBAC role and permission matrix' })
  @ApiResponse({ status: 200, description: 'Role permission matrix returned' })
  @Get('rbac/matrix')
  async getMatrix() {
    return this.rbacService.getRolePermissionMatrix();
  }

  @ApiOperation({ summary: 'Create custom platform role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @Post('rbac/roles')
  async createRole(
    @Body() body: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.createRole(body, req.user?.id);
  }

  @ApiOperation({ summary: 'Update permissions mapped to a role' })
  @ApiResponse({ status: 200, description: 'Role permissions updated' })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @Put('rbac/roles/:id/permissions')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() body: UpdateRolePermissionsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.updateRolePermissions(id, body, req.user?.id);
  }

  // ==========================================
  // 3. ADMINISTRATORS MANAGEMENT
  // ==========================================
  @ApiOperation({
    summary: 'List all platform administrators and clinic managers',
  })
  @ApiResponse({ status: 200, description: 'Administrators list returned' })
  @Get('administrators')
  async listAdministrators(@Query() query: AdministratorFilterDto) {
    return this.rbacService.listAdministrators(query);
  }

  @ApiOperation({
    summary: 'Provision new administrator or branch manager account',
  })
  @ApiResponse({ status: 201, description: 'Administrator created' })
  @Post('administrators')
  async createAdministrator(
    @Body() body: CreateAdministratorDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.createAdministrator(body, req.user?.id);
  }

  @ApiOperation({ summary: 'Suspend or reactivate an administrator account' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiParam({ name: 'id', description: 'Administrator User ID' })
  @Patch('administrators/:id/status')
  @Put('administrators/:id/status')
  async updateAdministratorStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdministratorStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rbacService.updateAdministratorStatus(id, body, req.user?.id);
  }
}
