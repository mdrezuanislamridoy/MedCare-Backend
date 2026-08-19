import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@medcare/shared';
import {
  ClinicFilterDto,
  CreateClinicDto,
  UpdateClinicDto,
} from '../../../../clinic-service/src/clinic/dto/clinic.dto';

@ApiTags('Clinics & Branch Management')
@Controller()
export class ClinicGatewayController {
  constructor(
    @Inject(MICROSERVICES.CLINIC) private readonly clinicClient: ClientProxy,
  ) {}

  // --- Public Clinics ---
  @Public()
  @ApiOperation({ summary: 'Public list active partner clinics' })
  @Get('public/clinics')
  async publicListClinics(@Query() query: ClinicFilterDto) {
    return this.clinicClient.send(PATTERNS.CLINIC.LIST, query);
  }

  // --- Admin Clinic Management ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all clinics' })
  @Get('admin/clinics')
  async adminListClinics(@Query() query: ClinicFilterDto) {
    return this.clinicClient.send(PATTERNS.CLINIC.LIST, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin register new clinic' })
  @ApiBody({ type: CreateClinicDto })
  @Post('admin/clinics')
  async adminCreateClinic(@Body() body: CreateClinicDto) {
    return this.clinicClient.send(PATTERNS.CLINIC.CREATE, body);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin update clinic details' })
  @ApiBody({ type: UpdateClinicDto })
  @Put('admin/clinics/:id')
  async adminUpdateClinic(@Param('id') id: string, @Body() body: UpdateClinicDto) {
    return this.clinicClient.send(PATTERNS.CLINIC.UPDATE, { id, dto: body });
  }

  // --- Clinic Manager Portal ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clinic manager get branch stats' })
  @Get('clinic-manager/stats')
  async managerGetStats(@Req() req: any, @Query('clinicId') clinicId?: string) {
    return this.clinicClient.send(PATTERNS.CLINIC.MANAGER_GET_STATS, {
      userId: req.user.id,
      clinicId,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clinic manager list staff' })
  @Get('clinic-manager/staff')
  async managerListStaff(
    @Req() req: any,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicClient.send(PATTERNS.CLINIC.MANAGER_LIST_STAFF, {
      userId: req.user.id,
      clinicId,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clinic manager list rooms' })
  @Get('clinic-manager/rooms')
  async managerListRooms(
    @Req() req: any,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.clinicClient.send(PATTERNS.CLINIC.MANAGER_LIST_ROOMS, {
      userId: req.user.id,
      clinicId,
    });
  }
}
