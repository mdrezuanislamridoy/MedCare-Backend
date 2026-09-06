import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
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
import { JwtAuthGuard, RolesGuard, Roles } from '@medcare/shared';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import {
  CreateComplaintDto,
  CreateSupportTicketDto,
  SupportFilterDto,
} from './dto/support.dto';

@ApiTags('Support Staff Portal')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPPORT_STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('support-staff')
export class SupportStaffGatewayController {
  constructor(
    @Inject(MICROSERVICES.APPOINTMENT) private readonly appointmentClient: ClientProxy,
    @Inject(MICROSERVICES.PATIENT) private readonly patientClient: ClientProxy,
  ) {}

  private async safeQuery<T>(client: ClientProxy, pattern: string, payload: any, fallback: T): Promise<T> {
    try {
      return await firstValueFrom(
        client.send<T>(pattern, payload).pipe(
          timeout(3000),
          catchError(() => of(fallback)),
        ),
      );
    } catch {
      return fallback;
    }
  }

  @ApiOperation({ summary: 'Support staff dashboard KPIs' })
  @Get('kpis')
  async getKpis() {
    const [appointmentsRes]: any = await Promise.all([
      this.safeQuery(this.appointmentClient, PATTERNS.APPOINTMENT.LIST, { limit: 200 }, { data: [], meta: { total: 0 } }),
    ]);

    const appointments: any[] = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];
    const todayStr = new Date().toISOString().split('T')[0];

    const resolvedToday = appointments.filter((a) => {
      const d = a.updatedAt ? new Date(a.updatedAt).toISOString().split('T')[0] : '';
      return d === todayStr && a.status === 'COMPLETED';
    }).length;

    const cancelled = appointments.filter((a) => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;
    const pending = appointments.filter((a) => ['PENDING', 'CONFIRMED', 'SCHEDULED'].includes(a.status)).length;

    return {
      openTickets: pending,
      resolvedToday,
      avgResponseTimeHours: 0,
      activeDisputes: cancelled,
      satisfactionRate: 0,
      escalatedTickets: 0,
      firstContactResolution: 0,
    };
  }

  @ApiOperation({ summary: 'Support staff dashboard summary' })
  @Get('dashboard')
  async getDashboard() {
    return this.getKpis();
  }

  @ApiOperation({ summary: 'List and filter support tickets' })
  @Get('tickets')
  async listTickets(@Query() query: SupportFilterDto) {
    const res = await this.safeQuery(
      this.appointmentClient,
      PATTERNS.APPOINTMENT.LIST,
      { limit: 50, ...query },
      { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    );
    return res;
  }

  @ApiOperation({ summary: 'Create ticket on behalf of a patient' })
  @ApiBody({ type: CreateSupportTicketDto })
  @Post('tickets')
  async createTicket(@Body() body: CreateSupportTicketDto, @Req() req: any) {
    return {
      success: true,
      id: `tkt_${Date.now()}`,
      creatorId: req.user?.id,
      ...body,
    };
  }

  @ApiOperation({ summary: 'List complaints and disputes' })
  @Get('complaints')
  async listComplaints(@Query() query: SupportFilterDto) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  @ApiOperation({ summary: 'Create patient complaint' })
  @ApiBody({ type: CreateComplaintDto })
  @Post('complaints')
  async createComplaint(@Body() body: CreateComplaintDto, @Req() req: any) {
    return {
      success: true,
      id: `cmp_${Date.now()}`,
      creatorId: req.user?.id,
      ...body,
    };
  }
}
