import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS, VerificationStatus } from '@medcare/contracts';
import { DoctorService } from './doctor.service';
import {
  DoctorFilterDto,
  UpdateDoctorStatusDto,
  VerificationDecisionDto,
  PatientDoctorSearchDto,
  DoctorScheduleDto,
  SaveConsultationNotesDto,
  CreateDoctorPrescriptionDto,
  DoctorAppointmentFilterDto,
  DoctorPayoutRequestDto,
  UpdateDoctorProfileDto,
} from './dto/doctor.dto';

@Controller()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @MessagePattern(PATTERNS.DOCTOR.LIST)
  async listDoctors(@Payload() filter: DoctorFilterDto) {
    return this.doctorService.listDoctors(filter);
  }

  @MessagePattern(PATTERNS.DOCTOR.GET_BY_ID)
  async getDoctorById(@Payload() id: string) {
    return this.doctorService.getDoctorById(id);
  }

  @MessagePattern(PATTERNS.DOCTOR.UPDATE_STATUS)
  async updateStatus(
    @Payload()
    payload: {
      id: string;
      dto: UpdateDoctorStatusDto;
      actorId?: string;
    },
  ) {
    return this.doctorService.updateDoctorStatus(
      payload.id,
      payload.dto.status,
      payload.dto.reason,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.LIST_VERIFICATIONS)
  async listVerifications(@Payload() payload: { status?: VerificationStatus }) {
    return this.doctorService.listVerificationQueue();
  }

  @MessagePattern(PATTERNS.DOCTOR.DECIDE_VERIFICATION)
  async decideVerification(
    @Payload() payload: { id: string; input: VerificationDecisionDto },
  ) {
    return this.doctorService.decideVerification(payload.id, payload.input);
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_SEARCH)
  async patientSearch(@Payload() filter: PatientDoctorSearchDto) {
    return this.doctorService.patientSearchDoctors(filter);
  }

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_GET_DETAILS)
  async patientGetDetails(@Payload() payload: { id: string }) {
    return this.doctorService.patientGetDoctorDetails(payload.id);
  }

  @MessagePattern(PATTERNS.DOCTOR.PATIENT_GET_SLOTS)
  async patientGetSlots(
    @Payload() payload: { doctorId: string; date: string },
  ) {
    return this.doctorService.patientGetAvailableSlots(
      payload.doctorId,
      payload.date,
    );
  }

  // --- Receptionist Portal Message Patterns ---

  @MessagePattern(PATTERNS.DOCTOR.RECEPTIONIST_SCHEDULE_GRID)
  async receptionistScheduleGrid(
    @Payload() payload: { date?: string; clinicId?: string },
  ) {
    return this.doctorService.receptionistGetScheduleGrid(
      payload?.date,
      payload?.clinicId,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.RECEPTIONIST_STATUS_LIST)
  async receptionistDoctorStatusList(
    @Payload() payload: { clinicId?: string },
  ) {
    return this.doctorService.receptionistGetDoctorStatusList(
      payload?.clinicId,
    );
  }

  // --- Doctor Portal Message Patterns ---

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_DASHBOARD)
  async doctorGetDashboard(@Payload() payload: { userId: string }) {
    return this.doctorService.doctorGetDashboard(payload.userId);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_WORKSPACE)
  async doctorGetWorkspace(
    @Payload() payload: { userId: string; appointmentId: string },
  ) {
    return this.doctorService.doctorGetWorkspace(
      payload.userId,
      payload.appointmentId,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_SAVE_NOTES)
  async doctorSaveNotes(
    @Payload()
    payload: {
      userId: string;
      appointmentId: string;
      dto: SaveConsultationNotesDto;
    },
  ) {
    return this.doctorService.doctorSaveConsultationNotes(
      payload.userId,
      payload.appointmentId,
      payload.dto,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_COMPLETE_CONSULTATION)
  async doctorCompleteConsultation(
    @Payload() payload: { userId: string; appointmentId: string; dto?: SaveConsultationNotesDto },
  ) {
    return this.doctorService.doctorCompleteConsultation(
      payload.userId,
      payload.appointmentId,
      payload.dto || ({} as any),
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_CREATE_PRESCRIPTION)
  async doctorCreatePrescription(
    @Payload() payload: { userId: string; appointmentId?: string; dto: CreateDoctorPrescriptionDto },
  ) {
    return this.doctorService.doctorCreatePrescription(
      payload.userId,
      payload.appointmentId || payload.dto?.appointmentId,
      payload.dto,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_LIST_PRESCRIPTIONS)
  async doctorListPrescriptions(
    @Payload() payload: { userId: string; query: any },
  ) {
    return this.doctorService.doctorListPrescriptions(
      payload.userId,
      payload.query,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_PRESCRIPTION)
  async doctorGetPrescription(
    @Payload() payload: { userId: string; id: string },
  ) {
    return this.doctorService.doctorGetPrescription(
      payload.userId,
      payload.id,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_LIST_APPOINTMENTS)
  async doctorListAppointments(
    @Payload() payload: { userId: string; query: DoctorAppointmentFilterDto },
  ) {
    return this.doctorService.doctorListAppointments(
      payload.userId,
      payload.query,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_APPOINTMENT)
  async doctorGetAppointment(
    @Payload() payload: { userId: string; id: string },
  ) {
    return this.doctorService.doctorGetAppointment(
      payload.userId,
      payload.id,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_VIDEO_TOKEN)
  async doctorGetVideoToken(
    @Payload() payload: { userId: string; appointmentId: string },
  ) {
    return this.doctorService.doctorGetVideoToken(
      payload.userId,
      payload.appointmentId,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_LIST_PATIENTS)
  async doctorListPatients(@Payload() payload: { userId: string; query: any }) {
    return this.doctorService.doctorListPatients(payload.userId, payload.query);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_PATIENT_RECORDS)
  async doctorGetPatientRecords(
    @Payload() payload: { userId: string; patientId: string },
  ) {
    return this.doctorService.doctorGetPatientRecords(
      payload.userId,
      payload.patientId,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_SCHEDULE)
  async doctorGetSchedule(@Payload() payload: { userId: string }) {
    return this.doctorService.doctorGetSchedule(payload.userId);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_UPDATE_SCHEDULE)
  async doctorUpdateSchedule(
    @Payload() payload: { userId: string; dto: DoctorScheduleDto },
  ) {
    return this.doctorService.doctorUpdateSchedule(payload.userId, payload.dto);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_EARNINGS)
  async doctorGetEarnings(@Payload() payload: { userId: string }) {
    return this.doctorService.doctorGetEarnings(payload.userId);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_REQUEST_PAYOUT)
  async doctorRequestPayout(
    @Payload() payload: { userId: string; dto: DoctorPayoutRequestDto },
  ) {
    return this.doctorService.doctorRequestPayout(payload.userId, payload.dto);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_LIST_REVIEWS)
  async doctorListReviews(@Payload() payload: { userId: string; query: any }) {
    return this.doctorService.doctorListReviews(payload.userId, payload.query);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_REPLY_REVIEW)
  async doctorReplyReview(
    @Payload() payload: { userId: string; reviewId: string; reply: string },
  ) {
    return this.doctorService.doctorReplyReview(
      payload.userId,
      payload.reviewId,
      payload.reply,
    );
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_GET_PROFILE)
  async doctorGetProfile(@Payload() payload: { userId: string }) {
    return this.doctorService.doctorGetProfile(payload.userId);
  }

  @MessagePattern(PATTERNS.DOCTOR.DOCTOR_UPDATE_PROFILE)
  async doctorUpdateProfile(
    @Payload() payload: { userId: string; dto: UpdateDoctorProfileDto },
  ) {
    return this.doctorService.doctorUpdateProfile(payload.userId, payload.dto);
  }
}
