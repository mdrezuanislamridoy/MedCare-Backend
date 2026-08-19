import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReviewFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: number;
}

export class SubmitReviewDto {
  @ApiProperty({ example: 'doc-123' })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @ApiPropertyOptional({ example: 'apt-123' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Excellent consultation, doctor listened very carefully.' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ModerateReviewDto {
  @ApiProperty({ example: 'APPROVED' })
  @IsNotEmpty()
  @IsString()
  status!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  moderationReason?: string;
}
