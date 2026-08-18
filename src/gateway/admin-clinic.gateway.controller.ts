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
import { ClinicService } from '../microservices/clinic/clinic.service';
import {
  ClinicFilterDto,
  CreateClinicDto,
  UpdateClinicDto,
  UpdateClinicStatusDto,
} from '../microservices/clinic/dto/clinic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Admin Clinic Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminClinicGatewayController {
  constructor(private readonly clinicService: ClinicService) {}

  @ApiOperation({ summary: 'List and filter clinics' })
  @ApiResponse({ status: 200, description: 'Clinics list returned' })
  @Get()
  async listClinics(@Query() query: ClinicFilterDto) {
    return this.clinicService.listClinics(query);
  }

  @ApiOperation({ summary: 'Get clinic details by ID' })
  @ApiResponse({ status: 200, description: 'Clinic details returned' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  @Get(':id')
  async getClinicById(@Param('id') id: string) {
    return this.clinicService.getClinicById(id);
  }

  @ApiOperation({ summary: 'Create a new clinic branch' })
  @ApiResponse({ status: 201, description: 'Clinic created' })
  @Post()
  async createClinic(
    @Body() body: CreateClinicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.createClinic(body, req.user?.id);
  }

  @ApiOperation({ summary: 'Update clinic information' })
  @ApiResponse({ status: 200, description: 'Clinic updated' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  @Put(':id')
  async updateClinic(
    @Param('id') id: string,
    @Body() body: UpdateClinicDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.updateClinic(id, body, req.user?.id);
  }

  @ApiOperation({
    summary: 'Update clinic status (ACTIVE, SUSPENDED, INACTIVE)',
  })
  @ApiResponse({ status: 200, description: 'Clinic status updated' })
  @ApiParam({ name: 'id', description: 'Clinic ID' })
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateClinicStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.clinicService.updateClinicStatus(
      id,
      body.status,
      body.reason,
      req.user?.id,
    );
  }
}
