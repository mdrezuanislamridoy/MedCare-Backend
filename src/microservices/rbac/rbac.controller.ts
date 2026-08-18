import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { RbacService } from './rbac.service';
import {
  AccessRequestFilterDto,
  CreateRoleDto,
  DecideAccessRequestDto,
  UpdateRolePermissionsDto,
} from './dto/rbac.dto';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @MessagePattern(PATTERNS.RBAC.LIST_REQUESTS)
  async listAccessRequests(@Payload() filter: AccessRequestFilterDto) {
    return this.rbacService.listAccessRequests(filter);
  }

  @MessagePattern(PATTERNS.RBAC.DECIDE_REQUEST)
  async decideRequest(
    @Payload()
    payload: {
      id: string;
      dto: DecideAccessRequestDto;
      superAdminId?: string;
    },
  ) {
    return this.rbacService.decideAccessRequest(
      payload.id,
      payload.dto,
      payload.superAdminId,
    );
  }

  @MessagePattern(PATTERNS.RBAC.GET_MATRIX)
  async getMatrix() {
    return this.rbacService.getRolePermissionMatrix();
  }

  @MessagePattern(PATTERNS.RBAC.UPDATE_PERMISSIONS)
  async updatePermissions(
    @Payload()
    payload: {
      roleId: string;
      dto: UpdateRolePermissionsDto;
      superAdminId?: string;
    },
  ) {
    return this.rbacService.updateRolePermissions(
      payload.roleId,
      payload.dto,
      payload.superAdminId,
    );
  }
}
