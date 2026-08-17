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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('Patient Portal')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get patient dashboard summary (stats, upcoming appointment, recent records)' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @Get('dashboard')
  async getDashboardSummary(@Req() req: AuthenticatedRequest) {
    return this.patientService.getDashboardSummary(req.user.id);
  }

  // ==========================================
  // 2. PROFILE & SETTINGS
  // ==========================================
  @ApiOperation({ summary: 'Get current patient profile details and emergency contact' })
  @ApiResponse({ status: 200, description: 'Profile details returned' })
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.patientService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: 'Update patient health metrics, emergency info, and contact details' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated' })
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
  @ApiOperation({ summary: 'Search active doctors by name, specialty, clinic, or rating' })
  @ApiResponse({ status: 200, description: 'Doctor search results returned' })
  @Get('doctors')
  async searchDoctors(@Query() query: PatientDoctorSearchDto) {
    return this.doctorService.patientSearchDoctors(query);
  }

  @ApiOperation({ summary: 'Get comprehensive details, bio, and reviews for a doctor' })
  @ApiResponse({ status: 200, description: 'Doctor profile returned' })
  @ApiParam({ name: 'id', description: 'Doctor Profile ID' })
  @Get('doctors/:id')
  async getDoctorDetails(@Param('id') id: string) {
    return this.doctorService.patientGetDoctorDetails(id);
  }

  @ApiOperation({ summary: 'Get available consultation time slots for a doctor on a specific date' })
  @ApiResponse({ status: 200, description: 'Time slots list returned' })
  @ApiParam({ name: 'id', description: 'Doctor Profile ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Target date (YYYY-MM-DD)' })
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
  @ApiOperation({ summary: 'List patient appointments by tab (upcoming, completed, cancelled, all)' })
  @ApiResponse({ status: 200, description: 'Appointments list returned' })
  @Get('appointments')
  async listAppointments(
    @Req() req: AuthenticatedRequest,
    @Query() query: PatientAppointmentFilterDto,
  ) {
    return this.appointmentService.patientListAppointments(req.user.id, query);
  }

  @ApiOperation({ summary: 'Get single appointment details by ID' })
  @ApiResponse({ status: 200, description: 'Appointment details returned' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Get('appointments/:id')
  async getAppointmentById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.appointmentService.patientGetAppointment(req.user.id, id);
  }

  @ApiOperation({ summary: 'Get WebRTC / Agora video session token and room ID for teleconsultation' })
  @ApiResponse({ status: 200, description: 'Video session room ID and token generated' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Get('appointments/:id/video-session')
  async getVideoSession(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.appointmentService.patientGetVideoSession(req.user.id, id);
  }

  @ApiOperation({ summary: 'Book a new doctor appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @Post(['appointments', 'appointments/book'])
  async bookAppointment(
    @Req() req: AuthenticatedRequest,
    @Body() body: BookAppointmentDto,
  ) {
    return this.appointmentService.patientBookAppointment(req.user.id, body);
  }

  @ApiOperation({ summary: 'Cancel an active appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Post('appointments/:id/cancel')
  @Delete('appointments/:id')
  async cancelAppointment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentService.patientCancelAppointment(req.user.id, id, reason);
  }

  @ApiOperation({ summary: 'Reschedule an appointment to a new date and time' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled' })
  @ApiParam({ name: 'id', description: 'Appointment ID' })
  @Post('appointments/:id/reschedule')
  @Patch(['appointments/:id/reschedule', 'appointments/:id'])
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
  @ApiOperation({ summary: 'List all digital prescriptions issued for current patient' })
  @ApiResponse({ status: 200, description: 'Prescriptions list returned' })
  @Get('prescriptions')
  async listPrescriptions(@Req() req: AuthenticatedRequest) {
    return this.patientService.listPrescriptions(req.user.id);
  }

  @ApiOperation({ summary: 'Get digital prescription details with medicines, dosage, and doctor notes' })
  @ApiResponse({ status: 200, description: 'Prescription details returned' })
  @ApiParam({ name: 'id', description: 'Prescription ID' })
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
  @ApiOperation({ summary: 'List patient medical records & lab reports' })
  @ApiResponse({ status: 200, description: 'Medical records list returned' })
  @ApiQuery({ name: 'category', enum: RecordCategory, required: false })
  @Get('medical-records')
  async listMedicalRecords(
    @Req() req: AuthenticatedRequest,
    @Query('category') category?: RecordCategory,
  ) {
    return this.patientService.listMedicalRecords(req.user.id, category);
  }

  @ApiOperation({ summary: 'Create medical record metadata entry' })
  @ApiResponse({ status: 201, description: 'Medical record created' })
  @Post('medical-records')
  async createMedicalRecord(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateMedicalRecordDto,
  ) {
    return this.patientService.createMedicalRecord(req.user.id, body);
  }

  @ApiOperation({ summary: 'Upload medical document / lab test file (PDF, JPG, PNG up to 10MB)' })
  @ApiResponse({ status: 201, description: 'File uploaded and record created' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        category: { type: 'string', enum: Object.values(RecordCategory) },
        notes: { type: 'string' },
        recordDate: { type: 'string' },
      },
    },
  })
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

  @ApiOperation({ summary: 'Delete a medical record' })
  @ApiResponse({ status: 200, description: 'Medical record deleted' })
  @ApiParam({ name: 'id', description: 'Medical Record ID' })
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
  @ApiOperation({ summary: 'Get patient financial summary (total spent, pending invoices count)' })
  @ApiResponse({ status: 200, description: 'Financial summary returned' })
  @Get('payments/summary')
  async getPaymentsSummary(@Req() req: AuthenticatedRequest) {
    return this.financeService.patientGetSummary(req.user.id);
  }

  @ApiOperation({ summary: 'List patient invoices and transaction history' })
  @ApiResponse({ status: 200, description: 'Invoices list returned' })
  @ApiQuery({ name: 'page', required: false, default: 1 })
  @ApiQuery({ name: 'limit', required: false, default: 10 })
  @Get('payments/invoices')
  async listInvoices(
    @Req() req: AuthenticatedRequest,
    @Query() query: { page?: number; limit?: number },
  ) {
    return this.financeService.patientListInvoices(req.user.id, query);
  }

  @ApiOperation({ summary: 'Create online payment checkout session' })
  @ApiResponse({ status: 201, description: 'Checkout session URL returned' })
  @Post('payments/checkout-session')
  async createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() body: { appointmentId: string; provider?: string; returnUrl?: string },
  ) {
    return this.financeService.createCheckoutSession(req.user.id, body);
  }

  @ApiOperation({ summary: 'Simulate or complete appointment direct payment' })
  @ApiResponse({ status: 200, description: 'Payment recorded and appointment marked PAID' })
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
  @ApiOperation({ summary: 'List completed appointments pending doctor review' })
  @ApiResponse({ status: 200, description: 'Pending reviews returned' })
  @Get('reviews/pending')
  async listPendingReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.patientListPendingReviews(req.user.id);
  }

  @ApiOperation({ summary: 'List reviews submitted by current patient' })
  @ApiResponse({ status: 200, description: 'Submitted reviews returned' })
  @Get('reviews/my-reviews')
  async listMyReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.patientListMyReviews(req.user.id);
  }

  @ApiOperation({ summary: 'Submit feedback and star rating for a doctor' })
  @ApiResponse({ status: 201, description: 'Review submitted' })
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
  @ApiOperation({ summary: 'List all notifications for patient' })
  @ApiResponse({ status: 200, description: 'Notifications list returned' })
  @Get('notifications')
  async listNotifications(@Req() req: AuthenticatedRequest) {
    return this.notificationService.patientListNotifications(req.user.id);
  }

  @ApiOperation({ summary: 'Mark single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationService.patientMarkRead(req.user.id, id);
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked read' })
  @Patch('notifications/read-all')
  async markAllNotificationsRead(@Req() req: AuthenticatedRequest) {
    return this.notificationService.patientMarkAllRead(req.user.id);
  }
}
