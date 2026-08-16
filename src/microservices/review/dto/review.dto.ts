import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../../../../generated/prisma/client';

export class ReviewFilterDto {
  @ApiPropertyOptional({ description: 'Search review text or patient/doctor name' })
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by Doctor ID' })
  doctorId?: string;

  @ApiPropertyOptional({ example: 5, description: 'Filter by rating score (1-5)' })
  rating?: number;

  @ApiPropertyOptional({ description: 'Filter only flagged reviews' })
  flagged?: boolean;

  @ApiPropertyOptional({ enum: ReviewStatus, description: 'Filter by review status' })
  status?: ReviewStatus;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}

export class ModerateReviewDto {
  @ApiProperty({ enum: ['PUBLISH', 'HIDE', 'FLAG', 'DISMISS_FLAG'], description: 'Moderation action to apply' })
  action!: 'PUBLISH' | 'HIDE' | 'FLAG' | 'DISMISS_FLAG';

  @ApiPropertyOptional({ description: 'Moderator justification reason' })
  reason?: string;
}

export class SubmitReviewDto {
  @ApiProperty({ example: 'doc-cuid-123', description: 'Doctor profile ID being reviewed' })
  doctorId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'Rating out of 5 stars' })
  rating!: number;

  @ApiProperty({ example: 'Dr. Linda was exceptionally attentive and answered all my questions clearly.', description: 'Review feedback' })
  content!: string;
}
