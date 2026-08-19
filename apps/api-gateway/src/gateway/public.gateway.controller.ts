import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DoctorService } from '../../../doctor-service/src/doctor/doctor.service';
import { ClinicService } from '../../../clinic-service/src/clinic/clinic.service';
import { AnalyticsService } from '../../../analytics-service/src/analytics/analytics.service';
import { PatientDoctorSearchDto } from '../../../doctor-service/src/doctor/dto/doctor.dto';
import { ClinicFilterDto } from '../../../clinic-service/src/clinic/dto/clinic.dto';

@ApiTags('Public & Landing Page')
@Controller('public')
export class PublicGatewayController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly clinicService: ClinicService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @ApiOperation({ summary: 'Get aggregated data for public landing page' })
  @ApiResponse({ status: 200, description: 'Landing aggregate data returned' })
  @Get('landing')
  async getLandingData() {
    const [doctorsRes, clinicsRes, statsRes] = await Promise.allSettled([
      this.doctorService.patientSearchDoctors({ limit: 8 }),
      this.clinicService.listClinics({ limit: 6 } as ClinicFilterDto),
      this.analyticsService.getOverview(),
    ]);

    return {
      doctors: doctorsRes.status === 'fulfilled' ? doctorsRes.value : null,
      clinics: clinicsRes.status === 'fulfilled' ? clinicsRes.value : null,
      stats: statsRes.status === 'fulfilled' ? statsRes.value : null,
    };
  }

  @ApiOperation({ summary: 'Public search and filter active verified doctors' })
  @ApiResponse({ status: 200, description: 'Doctor search results returned' })
  @Get('doctors')
  async searchDoctors(@Query() query: PatientDoctorSearchDto) {
    return this.doctorService.patientSearchDoctors(query);
  }

  @ApiOperation({ summary: 'Public get doctor details and reviews' })
  @ApiResponse({ status: 200, description: 'Doctor profile returned' })
  @ApiParam({ name: 'id', description: 'Doctor Profile ID' })
  @Get('doctors/:id')
  async getDoctorDetails(@Param('id') id: string) {
    return this.doctorService.patientGetDoctorDetails(id);
  }

  @ApiOperation({ summary: 'Public get doctor available slots for a date' })
  @ApiResponse({ status: 200, description: 'Doctor slots returned' })
  @ApiParam({ name: 'id', description: 'Doctor Profile ID' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  @Get('doctors/:id/slots')
  async getDoctorSlots(@Param('id') id: string, @Query('date') date: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.doctorService.patientGetDoctorSlots(id, targetDate);
  }

  @ApiOperation({ summary: 'Public list partner clinics' })
  @ApiResponse({ status: 200, description: 'Clinics list returned' })
  @Get('clinics')
  async listClinics(@Query() query: ClinicFilterDto) {
    return this.clinicService.listClinics(query);
  }

  @ApiOperation({ summary: 'Public get platform statistics' })
  @ApiResponse({ status: 200, description: 'Platform statistics returned' })
  @Get('stats')
  async getStats() {
    return this.analyticsService.getOverview();
  }
}
