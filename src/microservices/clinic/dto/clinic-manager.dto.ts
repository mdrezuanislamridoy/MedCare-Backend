import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AccountStatus,
  RoomType,
  RoomStatus,
  StaffRole,
  StaffShiftStatus,
  AppointmentStatus,
} from '../../../../generated/prisma/client';

export class UpdateClinicBranchProfileDto {
  @ApiPropertyOptional({
    example: 'MedCare Central Clinic & Diagnostic Centre',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Central Medical Zone, Tower B' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '124 Healthcare Boulevard, Suite 400' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '1212' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '+880 1700-112233' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'central-clinic@medcare.com' })
  @IsOptional()
  @IsString()
  email?: string;
}

export class AssignDoctorToClinicDto {
  @ApiProperty({
    example: 'doc-prof-101',
    description: 'DoctorProfile ID to assign to this clinic branch',
  })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @ApiPropertyOptional({
    example: 'Room 302',
    description: 'Assigned consultation room number',
  })
  @IsOptional()
  @IsString()
  roomNumber?: string;
}

export class CreateClinicStaffDto {
  @ApiProperty({
    example: 'Amina Khatun',
    description: 'Full staff member name',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'amina.reception@medcare.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+880 1811-223344' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: StaffRole, example: StaffRole.RECEPTIONIST })
  @IsNotEmpty()
  @IsEnum(StaffRole)
  role!: StaffRole;

  @ApiPropertyOptional({
    enum: StaffShiftStatus,
    example: StaffShiftStatus.ON_DUTY,
    default: StaffShiftStatus.OFF_DUTY,
  })
  @IsOptional()
  @IsEnum(StaffShiftStatus)
  shiftStatus?: StaffShiftStatus;

  @ApiPropertyOptional({ example: '08:00 AM' })
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiPropertyOptional({ example: '04:00 PM' })
  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @ApiPropertyOptional({ example: 'Front Desk & Patient Triage' })
  @IsOptional()
  @IsString()
  assignedDepartment?: string;
}

export class UpdateClinicStaffDto {
  @ApiPropertyOptional({ example: 'Amina Khatun' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'amina.reception@medcare.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+880 1811-223344' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: StaffRole, example: StaffRole.NURSE })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiPropertyOptional({
    enum: StaffShiftStatus,
    example: StaffShiftStatus.ON_DUTY,
  })
  @IsOptional()
  @IsEnum(StaffShiftStatus)
  shiftStatus?: StaffShiftStatus;

  @ApiPropertyOptional({ example: '08:00 AM' })
  @IsOptional()
  @IsString()
  shiftStart?: string;

  @ApiPropertyOptional({ example: '04:00 PM' })
  @IsOptional()
  @IsString()
  shiftEnd?: string;

  @ApiPropertyOptional({ example: 'Inpatient Nursing Ward' })
  @IsOptional()
  @IsString()
  assignedDepartment?: string;
}

export class CreateClinicRoomDto {
  @ApiProperty({ example: '302', description: 'Room identification number' })
  @IsNotEmpty()
  @IsString()
  roomNumber!: string;

  @ApiProperty({
    example: 'Cardiology Consultation Suite',
    description: 'Descriptive room name',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '3rd Floor, West Wing' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({
    enum: RoomType,
    example: RoomType.CONSULTATION,
    default: RoomType.CONSULTATION,
  })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiPropertyOptional({
    enum: RoomStatus,
    example: RoomStatus.AVAILABLE,
    default: RoomStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: [
      'ECG Monitor',
      'Digital Blood Pressure Cuff',
      'Stethoscope',
      'Examination Bed',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({
    example: 'doc-prof-101',
    description: 'DoctorProfile ID currently assigned to this room',
  })
  @IsOptional()
  @IsString()
  currentDoctorId?: string;
}

export class UpdateClinicRoomDto {
  @ApiPropertyOptional({ example: '302' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 'Cardiology Consultation Suite' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '3rd Floor, West Wing' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ enum: RoomType, example: RoomType.CONSULTATION })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiPropertyOptional({ enum: RoomStatus, example: RoomStatus.OCCUPIED })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({
    example: ['ECG Monitor', 'Examination Bed', 'Oxygen Concentrator'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({ example: 'doc-prof-101' })
  @IsOptional()
  @IsString()
  currentDoctorId?: string;
}

export class ClinicDoctorFilterDto {
  @ApiPropertyOptional({
    example: 'Cardiology',
    description: 'Filter by doctor medical specialty',
  })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({
    example: 'Sarah',
    description: 'Search doctor name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ClinicStaffFilterDto {
  @ApiPropertyOptional({ enum: StaffRole, example: StaffRole.RECEPTIONIST })
  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @ApiPropertyOptional({
    enum: StaffShiftStatus,
    example: StaffShiftStatus.ON_DUTY,
  })
  @IsOptional()
  @IsEnum(StaffShiftStatus)
  shiftStatus?: StaffShiftStatus;

  @ApiPropertyOptional({
    example: 'Amina',
    description: 'Search staff name, email, or department',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ClinicRoomFilterDto {
  @ApiPropertyOptional({ enum: RoomType, example: RoomType.CONSULTATION })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiPropertyOptional({ enum: RoomStatus, example: RoomStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({
    example: '302',
    description: 'Search room number or room name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ClinicAppointmentFilterDto {
  @ApiPropertyOptional({
    enum: AppointmentStatus,
    example: AppointmentStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    example: '2026-08-17',
    description: 'Filter by appointment date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    example: 'doc-prof-101',
    description: 'Filter by doctor ID',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ClinicFinancialFilterDto {
  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'End date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ClinicReportFilterDto {
  @ApiPropertyOptional({
    example: '30',
    default: '30',
    description: 'Reporting period in days (7, 30, 90, 365)',
  })
  @IsOptional()
  @IsString()
  periodDays?: string;
}
