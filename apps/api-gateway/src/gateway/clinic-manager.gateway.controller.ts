import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable, interval, map, merge } from 'rxjs';
import { ClinicService } from '../microservices/clinic/clinic.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import {
  UpdateClinicBranchProfileDto,
  AssignDoctorToClinicDto,
  CreateClinicStaffDto,
  UpdateClinicStaffDto,
  CreateClinicRoomDto,
  UpdateClinicRoomDto,
  ClinicDoctorFilterDto,
  ClinicStaffFilterDto,
  ClinicRoomFilterDto,
  ClinicAppointmentFilterDto,
  ClinicFinancialFilterDto,
  ClinicReportFilterDto,
} from '../microservices/clinic/dto/clinic-manager.dto';

@ApiTags('Clinic Manager Portal')
@ApiBearerAuth('JWT-auth')
@Controller('clinic-manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ClinicManagerGatewayController {
  constructor(private readonly clinicService: ClinicService) {}

  // ==========================================
  // 1. DASHBOARD OVERVIEW & STATS
  // ==========================================
  @ApiOperation({
    summary:
      'Get clinic branch overview metrics (doctors on duty, occupied rooms, queue, daily revenue)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard metrics returned' })
  @ApiQuery({
    name: 'clinicId',
    required: false,
    description: 'Optional clinic branch ID for Admins',
  })
  @Get('dashboard')
  async getDashboard(
    @Req() req: AuthenticatedRequest,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicDashboardStats(req.user.id, clinicId);
  }

  // ==========================================
  // 2. CLINIC BRANCH PROFILE
  // ==========================================
  @ApiOperation({ summary: 'Get clinic branch profile details and facilities' })
  @ApiResponse({ status: 200, description: 'Clinic profile returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('profile')
  async getProfile(
    @Req() req: AuthenticatedRequest,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicProfile(req.user.id, clinicId);
  }

  @ApiOperation({
    summary:
      'Update clinic branch contact details, address, and operating info',
  })
  @ApiResponse({ status: 200, description: 'Clinic profile updated' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateClinicBranchProfileDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.updateClinicProfile(
      req.user.id,
      clinicId,
      body,
      req.user.id,
    );
  }

  // ==========================================
  // 3. DOCTORS MANAGEMENT
  // ==========================================
  @ApiOperation({
    summary: 'List doctors assigned to this clinic with duty schedule and room',
  })
  @ApiResponse({ status: 200, description: 'Clinic doctors list returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('doctors')
  async listDoctors(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicDoctorFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.listClinicDoctors(req.user.id, clinicId, filter);
  }

  @ApiOperation({
    summary: 'Assign a doctor to this clinic branch and allocate room',
  })
  @ApiResponse({ status: 201, description: 'Doctor assigned to clinic' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Post('doctors')
  async assignDoctor(
    @Req() req: AuthenticatedRequest,
    @Body() body: AssignDoctorToClinicDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.assignDoctorToClinic(
      req.user.id,
      clinicId,
      body,
      req.user.id,
    );
  }

  @ApiOperation({ summary: 'Remove a doctor from this clinic branch roster' })
  @ApiResponse({ status: 200, description: 'Doctor unassigned from clinic' })
  @ApiParam({ name: 'doctorId', example: 'doc-prof-101' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Delete('doctors/:doctorId')
  async removeDoctor(
    @Req() req: AuthenticatedRequest,
    @Param('doctorId') doctorId: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.removeDoctorFromClinic(
      req.user.id,
      clinicId,
      doctorId,
      req.user.id,
    );
  }

  // ==========================================
  // 4. STAFF ROSTER MANAGEMENT
  // ==========================================
  @ApiOperation({
    summary:
      'List clinic staff roster (receptionists, nurses, lab techs) and shift status',
  })
  @ApiResponse({ status: 200, description: 'Clinic staff roster returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('staff')
  async listStaff(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicStaffFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.listClinicStaff(req.user.id, clinicId, filter);
  }

  @ApiOperation({
    summary: 'Add a new staff member to the clinic branch roster',
  })
  @ApiResponse({ status: 201, description: 'Staff member added to roster' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Post('staff')
  async createStaff(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateClinicStaffDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.createClinicStaff(
      req.user.id,
      clinicId,
      body,
      req.user.id,
    );
  }

  @ApiOperation({
    summary: 'Update staff shift status, shift hours, or assigned department',
  })
  @ApiResponse({ status: 200, description: 'Staff member updated' })
  @ApiParam({ name: 'staffId', example: 'staff-1001' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Patch('staff/:staffId')
  async updateStaff(
    @Req() req: AuthenticatedRequest,
    @Param('staffId') staffId: string,
    @Body() body: UpdateClinicStaffDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.updateClinicStaff(
      req.user.id,
      clinicId,
      staffId,
      body,
      req.user.id,
    );
  }

  @ApiOperation({ summary: 'Remove a staff member from the clinic roster' })
  @ApiResponse({ status: 200, description: 'Staff member removed' })
  @ApiParam({ name: 'staffId', example: 'staff-1001' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Delete('staff/:staffId')
  async deleteStaff(
    @Req() req: AuthenticatedRequest,
    @Param('staffId') staffId: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.deleteClinicStaff(
      req.user.id,
      clinicId,
      staffId,
      req.user.id,
    );
  }

  // ==========================================
  // 5. ROOMS MANAGEMENT
  // ==========================================
  @ApiOperation({
    summary:
      'List clinic consultation and surgical rooms with live occupancy status',
  })
  @ApiResponse({ status: 200, description: 'Clinic rooms list returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('rooms')
  async listRooms(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicRoomFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.listClinicRooms(req.user.id, clinicId, filter);
  }

  @ApiOperation({
    summary:
      'Create a new room in the clinic with equipment and doctor assignment',
  })
  @ApiResponse({ status: 201, description: 'Clinic room created' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Post('rooms')
  async createRoom(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateClinicRoomDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.createClinicRoom(
      req.user.id,
      clinicId,
      body,
      req.user.id,
    );
  }

  @ApiOperation({
    summary:
      'Update room status (AVAILABLE, OCCUPIED, MAINTENANCE) or assigned doctor',
  })
  @ApiResponse({ status: 200, description: 'Clinic room updated' })
  @ApiParam({ name: 'roomId', example: 'room-302' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Patch('rooms/:roomId')
  async updateRoom(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Body() body: UpdateClinicRoomDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.updateClinicRoom(
      req.user.id,
      clinicId,
      roomId,
      body,
      req.user.id,
    );
  }

  @ApiOperation({ summary: 'Delete a room from the clinic inventory' })
  @ApiResponse({ status: 200, description: 'Clinic room deleted' })
  @ApiParam({ name: 'roomId', example: 'room-302' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Delete('rooms/:roomId')
  async deleteRoom(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.deleteClinicRoom(
      req.user.id,
      clinicId,
      roomId,
      req.user.id,
    );
  }

  // ==========================================
  // 6. APPOINTMENTS & QUEUES
  // ==========================================
  @ApiOperation({
    summary: 'List clinic branch appointments with patient and doctor details',
  })
  @ApiResponse({ status: 200, description: 'Clinic appointments returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('appointments')
  async getAppointments(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicAppointmentFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicAppointments(
      req.user.id,
      clinicId,
      filter,
    );
  }

  @ApiOperation({
    summary: 'Get real-time patient queue for the clinic branch',
  })
  @ApiResponse({ status: 200, description: 'Live queue list returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('queue')
  async getQueue(
    @Req() req: AuthenticatedRequest,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicQueue(req.user.id, clinicId);
  }

  // ==========================================
  // 7. FINANCIALS & REPORTS
  // ==========================================
  @ApiOperation({
    summary:
      'Get clinic branch revenue breakdown (cash, video visits, completed consultations)',
  })
  @ApiResponse({ status: 200, description: 'Financial summary returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('payments')
  async getPayments(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicFinancialFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicFinancialSummary(
      req.user.id,
      clinicId,
      filter,
    );
  }

  @ApiOperation({
    summary:
      'Get clinic performance analytics, completion rates, and doctor utilization',
  })
  @ApiResponse({ status: 200, description: 'Performance report returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('reports')
  async getReports(
    @Req() req: AuthenticatedRequest,
    @Query() filter: ClinicReportFilterDto,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicReports(req.user.id, clinicId, filter);
  }

  // ==========================================
  // 8. ACTIVITY & AUDIT LOGS
  // ==========================================
  @ApiOperation({
    summary: 'Get clinic branch audit trail and operational activity logs',
  })
  @ApiResponse({ status: 200, description: 'Clinic activity logs returned' })
  @ApiQuery({ name: 'clinicId', required: false })
  @Get('activity')
  async getActivityLogs(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicService.getClinicActivityLogs(req.user.id, clinicId, {
      page,
      limit,
    });
  }

  // ==========================================
  // 9. LIVE ROOM & QUEUE SSE STREAM
  // ==========================================
  @ApiOperation({
    summary:
      'Server-Sent Events (SSE) live stream for room occupancy and queue updates',
  })
  @ApiResponse({ status: 200, description: 'Clinic live stream connected' })
  @Sse('stream')
  streamClinicEvents(): Observable<MessageEvent> {
    const clinicEvents$ = this.clinicService.getStream().pipe(
      map((event) => ({
        data: event,
        type: 'clinic-event',
      })),
    );

    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: { type: 'HEARTBEAT', timestamp: new Date().toISOString() },
        type: 'heartbeat',
      })),
    );

    return merge(clinicEvents$, heartbeat$);
  }
}
