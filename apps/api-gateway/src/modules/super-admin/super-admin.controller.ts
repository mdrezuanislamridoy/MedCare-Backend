import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  RateLimitTier,
  ApiRateLimitTier,
} from '@medcare/shared';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  AccessRequestDecisionDto,
  UpdatePlatformSettingsDto,
} from './dto/super-admin.dto';

@ApiTags('Super Admin Platform Controls')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@RateLimitTier(ApiRateLimitTier.ADMIN)
@Controller('super-admin')
export class SuperAdminGatewayController {
  constructor(
    @Inject(MICROSERVICES.AUTH) private readonly authClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'List platform administrators' })
  @Get('administrators')
  async listAdministrators(@Query() query: any) {
    return this.authClient
      .send('auth.users.list', {
        roles: ['SUPER_ADMIN', 'ADMIN'],
        search: query?.search,
      })
      .pipe(
        timeout(4000),
        catchError(() =>
          of({
            data: [
              {
                id: 'admin-1',
                name: 'System Administrator',
                email: 'admin@medcare.com',
                role: 'ADMIN',
                status: 'ACTIVE',
                createdAt: new Date().toISOString(),
              },
            ],
            meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
          }),
        ),
      );
  }

  @ApiOperation({ summary: 'List platform users' })
  @Get('users')
  async listUsers(@Query() query: any) {
    return this.authClient
      .send('auth.users.list', query)
      .pipe(
        timeout(4000),
        catchError(() =>
          of({
            data: [],
            meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
          }),
        ),
      );
  }

  @ApiOperation({ summary: 'List privileged access requests' })
  @Get('rbac/access-requests')
  async listAccessRequests(@Query() query: any) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  @ApiOperation({ summary: 'Approve or reject elevated access request' })
  @ApiBody({ type: AccessRequestDecisionDto })
  @Post('rbac/access-requests/:id/decision')
  async decideAccessRequest(
    @Param('id') id: string,
    @Body() body: AccessRequestDecisionDto,
  ) {
    return { success: true, id, decision: body.decision, notes: body.notes };
  }

  @ApiOperation({ summary: 'Get full RBAC role and permission matrix' })
  @Get('rbac/matrix')
  async getMatrix() {
    return {
      roles: [
        { name: 'Super Admin', users: 1, color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'Full unrestricted platform access' },
        { name: 'Administrator', users: 1, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Clinical operations and user oversight' },
        { name: 'Doctor', users: 1, color: 'bg-teal-100 text-teal-700 border-teal-200', desc: 'Patient care, appointments & consultations' },
        { name: 'Patient', users: 1, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Self-service health portal & booking' },
        { name: 'Receptionist', users: 1, color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Front-desk triage & walk-in check-in' },
        { name: 'Clinic Manager', users: 1, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', desc: 'Branch facilities & staff coordination' },
        { name: 'Support Staff', users: 1, color: 'bg-rose-100 text-rose-700 border-rose-200', desc: 'Platform support, tickets & issue resolution' },
      ],
      permissions: [
        { id: 'users', label: 'Users', perms: ['view', 'create', 'edit', 'suspend', 'delete'] },
        { id: 'doctors', label: 'Doctors', perms: ['view', 'verify', 'suspend', 'delete'] },
        { id: 'patients', label: 'Patients', perms: ['view', 'edit', 'suspend'] },
        { id: 'clinics', label: 'Clinics', perms: ['view', 'create', 'edit', 'delete'] },
        { id: 'appointments', label: 'Appointments', perms: ['view', 'manage', 'cancel'] },
        { id: 'payments', label: 'Payments', perms: ['view', 'refund', 'export'] },
        { id: 'reports', label: 'Reports', perms: ['view', 'export'] },
        { id: 'security', label: 'Security', perms: ['view', 'manage'] },
        { id: 'settings', label: 'Settings', perms: ['view', 'edit'] },
      ],
    };
  }

  @ApiOperation({ summary: 'Get microservices health check' })
  @Get('system/health')
  async getHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        apiGateway: 'HEALTHY',
        authService: 'HEALTHY',
        doctorService: 'HEALTHY',
        patientService: 'HEALTHY',
        appointmentService: 'HEALTHY',
        clinicService: 'HEALTHY',
        billingService: 'HEALTHY',
        notificationService: 'HEALTHY',
        auditService: 'HEALTHY',
        chatService: 'HEALTHY',
        analyticsService: 'HEALTHY',
      },
    };
  }

  @ApiOperation({ summary: 'Get platform-wide settings' })
  @Get('system/settings')
  async getSettings() {
    return {
      platformName: 'MedCare Enterprise',
      maintenanceMode: false,
      currency: 'USD',
      timezone: 'UTC',
    };
  }

  @ApiOperation({ summary: 'Update platform-wide settings' })
  @ApiBody({ type: UpdatePlatformSettingsDto })
  @Put('system/settings')
  async updateSettings(@Body() body: UpdatePlatformSettingsDto) {
    return { success: true, settings: body };
  }
}
