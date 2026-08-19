import { Injectable } from '@nestjs/common';
import { ModerateReviewDto, ReviewFilterDto, SubmitReviewDto } from '../dto/review.dto';

@Injectable()
export class ReviewService {
  async listReviews(query: ReviewFilterDto) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  async moderateReview(id: string, body: ModerateReviewDto, moderatorId?: string) {
    return { success: true, id, status: body.status };
  }

  async submitReview(userId: string, body: SubmitReviewDto) {
    return { success: true, id: `rev_${Date.now()}`, userId, ...body };
  }
}
