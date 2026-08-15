import { ReviewStatus } from '../../../../generated/prisma/client';

export class ReviewFilterDto {
  q?: string;
  doctorId?: string;
  rating?: number;
  flagged?: boolean;
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}

export class ModerateReviewDto {
  action!: 'PUBLISH' | 'HIDE' | 'FLAG' | 'DISMISS_FLAG';
  reason?: string;
}

export class SubmitReviewDto {
  doctorId!: string;
  rating!: number;
  content!: string;
}
