import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles } from '@medcare/shared';
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
  @ApiOperation({ summary: 'Support staff dashboard KPIs' })
  @Get('dashboard')
  async getDashboard() {
    return {
      openTickets: 4,
      pendingComplaints: 2,
      resolvedToday: 18,
      averageResponseTimeMin: 12,
    };
  }

  @ApiOperation({ summary: 'List and filter support tickets' })
  @Get('tickets')
  async listTickets(@Query() query: SupportFilterDto) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
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
