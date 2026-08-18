import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ReviewStatus } from '../../../../generated/prisma/client';

export class ReviewFilterDto {
  @ApiPropertyOptional({
    example: 'attentive',
    description: 'Search review text or patient/doctor name',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'doc-1001',
    description: 'Filter by Doctor ID',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Filter by rating score (1-5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter only flagged reviews',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  flagged?: boolean;

  @ApiPropertyOptional({
    enum: ReviewStatus,
    example: ReviewStatus.PUBLISHED,
    description: 'Filter by review status',
  })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

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

export class ModerateReviewDto {
  @ApiProperty({
    enum: ['PUBLISH', 'HIDE', 'FLAG', 'DISMISS_FLAG'],
    example: 'PUBLISH',
    description: 'Moderation action to apply',
  })
  @IsNotEmpty()
  @IsEnum(['PUBLISH', 'HIDE', 'FLAG', 'DISMISS_FLAG'])
  action!: 'PUBLISH' | 'HIDE' | 'FLAG' | 'DISMISS_FLAG';

  @ApiPropertyOptional({
    example: 'Review adheres to community healthcare guidelines.',
    description: 'Moderator justification reason',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SubmitReviewDto {
  @ApiProperty({
    example: 'doc-1001',
    description: 'Doctor profile ID being reviewed',
  })
  @IsNotEmpty()
  @IsString()
  doctorId!: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Rating out of 5 stars',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({
    example:
      'Dr. Sarah was exceptionally attentive, answered all my questions, and explained my prescription clearly.',
    description: 'Review feedback',
  })
  @IsNotEmpty()
  @IsString()
  content!: string;
}
