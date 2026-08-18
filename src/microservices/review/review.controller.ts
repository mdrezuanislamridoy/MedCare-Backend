import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { ReviewService } from './review.service';
import {
  ModerateReviewDto,
  ReviewFilterDto,
  SubmitReviewDto,
} from './dto/review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern(PATTERNS.REVIEW.LIST)
  async listReviews(@Payload() filter: ReviewFilterDto) {
    return this.reviewService.listReviews(filter);
  }

  @MessagePattern(PATTERNS.REVIEW.MODERATE)
  async moderateReview(
    @Payload()
    payload: {
      id: string;
      dto: ModerateReviewDto;
      actorId?: string;
    },
  ) {
    return this.reviewService.moderateReview(
      payload.id,
      payload.dto,
      payload.actorId,
    );
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.REVIEW.PATIENT_PENDING)
  async patientPendingReviews(@Payload() payload: { userId: string }) {
    return this.reviewService.patientListPendingReviews(payload.userId);
  }

  @MessagePattern(PATTERNS.REVIEW.PATIENT_SUBMIT)
  async patientSubmitReview(
    @Payload() payload: { userId: string; dto: SubmitReviewDto },
  ) {
    return this.reviewService.patientSubmitReview(payload.userId, payload.dto);
  }

  @MessagePattern(PATTERNS.REVIEW.PATIENT_MY_REVIEWS)
  async patientMyReviews(@Payload() payload: { userId: string }) {
    return this.reviewService.patientListMyReviews(payload.userId);
  }
}
