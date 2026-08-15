import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, RecordCategory } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';
import {
  medicalRecordStorage,
  medicalRecordFileFilter,
  MAX_FILE_SIZE_BYTES,
} from '../common/utils/file-upload.util';

import { PatientService } from '../microservices/patient/patient.service';
import { AppointmentService } from '../microservices/appointment/appointment.service';
import { DoctorService } from '../microservices/doctor/doctor.service';
import { FinanceService } from '../microservices/finance/finance.service';
import { ReviewService } from '../microservices/review/review.service';
import { NotificationService } from '../microservices/notification/notification.service';

import {
  UpdatePatientProfileDto,
  CreateMedicalRecordDto,
} from '../microservices/patient/dto/patient.dto';
import {
  BookAppointmentDto,
  PatientAppointmentFilterDto,
  RescheduleAppointmentDto,
} from '../microservices/appointment/dto/appointment.dto';
import { PatientDoctorSearchDto } from '../microservices/doctor/dto/doctor.dto';
import { PatientPaymentDto } from '../microservices/finance/dto/finance.dto';
import { SubmitReviewDto } from '../microservices/review/dto/review.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class PatientGatewayController {
  constructor(
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
    private readonly doctorService: DoctorService,
    private readonly financeService: FinanceService,
    private readonly reviewService: ReviewService,
    private readonly notificationService: NotificationService,
  ) {}

  // ==========================================
  // 1. DASHBOARD OVERVIEW
  // ==========================================
  @Get('dashboard')
  async getDashboardSummary(@Req() req: AuthenticatedRequest) {
    return this.patientService.getDashboardSummary(req.user.id);
  }

  // ==========================================
  // 2. PROFILE & SETTINGS
  // ==========================================
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.patientService.getProfile(req.user.id);
  }

  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdatePatientProfileDto,
  ) {
    return this.patientService.updateProfile(req.user.id, body);
  }

  // ==========================================
  // 3. DOCTORS SEARCH & SLOTS
  // ==========================================
  @Get('doctors')
  async searchDoctors(@Query() query: PatientDoctorSearchDto) {
    return this.doctorService.patientSearchDoctors(query);
  }

  @Get('doctors/:id')
  async getDoctorDetails(@Param('id') id: string) {
    return this.doctorService.patientGetDoctorDetails(id);
  }

  @Get('doctors/:id/slots')
  async getDoctorSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.doctorService.patientGetDoctorSlots(id, targetDate);
  }

  // ==========================================
  // 4. APPOINTMENTS
  // ==========================================
  @Get('appointments')
  async listAppointments(
    @Req() req: AuthenticatedRequest,
    @Query() query: PatientAppointmentFilterDto,
  ) {
    return this.appointmentService.patientListAppointments(req.user.id, query);
  }

  @Get('appointments/:id')
  async getAppointmentById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.appointmentService.patientGetAppointment(req.user.id, id);
  }

  @Get('appointments/:id/video-session')
  async getVideoSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.appointmentService.patientGetVideoSession(req.user.id, id);
  }

  @Post('appointments/book')
  async bookAppointment(
    @Req() req: AuthenticatedRequest,
    @Body() body: BookAppointmentDto,
  ) {
    return this.appointmentService.patientBookAppointment(req.user.id, body);
  }

  @Post('appointments/:id/cancel')
  async cancelAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentService.patientCancelAppointment(req.user.id, id, reason);
  }

  @Post('appointments/:id/reschedule')
  async rescheduleAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: RescheduleAppointmentDto,
  ) {
    return this.appointmentService.patientRescheduleAppointment(req.user.id, id, body);
  }

  // ==========================================
  // 5. PRESCRIPTIONS
  // ==========================================
  @Get('prescriptions')
  async listPrescriptions(@Req() req: AuthenticatedRequest) {
    return this.patientService.listPrescriptions(req.user.id);
  }

  @Get('prescriptions/:id')
  async getPrescription(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.patientService.getPrescriptionById(req.user.id, id);
  }

  // ==========================================
  // 6. MEDICAL RECORDS & REPORTS
  // ==========================================
  @Get('medical-records')
  async listMedicalRecords(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: RecordCategory,
  ) {
    return this.patientService.listMedicalRecords(req.user.id, category);
  }

  @Post('medical-records')
  async createMedicalRecord(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateMedicalRecordDto,
  ) {
    return this.patientService.createMedicalRecord(req.user.id, body);
  }

  @Post('medical-records/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: medicalRecordStorage,
      fileFilter: medicalRecordFileFilter,
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async uploadMedicalRecord(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; category?: RecordCategory; notes?: string; recordDate?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a file to upload');
    }
    const fileUrl = `/uploads/medical-records/${file.filename}`;
    return this.patientService.createMedicalRecord(req.user.id, {
      title: body.title || file.originalname,
      category: body.category || RecordCategory.LAB_REPORT,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      notes: body.notes,
      recordDate: body.recordDate,
    });
  }

  @Delete('medical-records/:id')
  async deleteMedicalRecord(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.patientService.deleteMedicalRecord(req.user.id, id);
  }

  // ==========================================
  // 7. PAYMENTS & INVOICES
  // ==========================================
  @Get('payments/summary')
  async getPaymentsSummary(@Req() req: AuthenticatedRequest) {
    return this.financeService.patientGetSummary(req.user.id);
  }

  @Get('payments/invoices')
  async listInvoices(
    @Req() req: AuthenticatedRequest,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.financeService.patientListInvoices(req.user.id, query);
  }

  @Post('payments/checkout-session')
  async createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() body: { appointmentId: string; provider?: string; returnUrl?: string },
  ) {
    return this.financeService.createCheckoutSession(req.user.id, body);
  }

  @Post('payments/pay')
  async payAppointment(
    @Req() req: AuthenticatedRequest,
    @Body() body: PatientPaymentDto,
  ) {
    return this.financeService.patientPayAppointment(req.user.id, body);
  }

  // ==========================================
  // 8. REVIEWS & RATINGS
  // ==========================================
  @Get('reviews/pending')
  async listPendingReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.patientListPendingReviews(req.user.id);
  }

  @Get('reviews/my-reviews')
  async listMyReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.patientListMyReviews(req.user.id);
  }

  @Post('reviews')
  async submitReview(
    @Req() req: AuthenticatedRequest,
    @Body() body: SubmitReviewDto,
  ) {
    return this.reviewService.patientSubmitReview(req.user.id, body);
  }

  // ==========================================
  // 9. NOTIFICATIONS
  // ==========================================
  @Get('notifications')
  async listNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationService.patientListNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationService.patientMarkRead(req.user.id, id);
  }

  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationService.patientMarkAllRead(req.user.id);
  }
}
