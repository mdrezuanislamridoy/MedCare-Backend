import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { ReviewService } from './review.service';
import { ModerateReviewDto, ReviewFilterDto } from './dto/review.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @MessagePattern(PATTERNS.REVIEW.LIST)
  async listReviews(@Payload() filter: ReviewFilterDto) {
    return this.reviewService.listReviews(filter);
  }

  @MessagePattern(PATTERNS.REVIEW.MODERATE)
  async moderateReview(@Payload() payload: { id: string; dto: ModerateReviewDto; actorId?: string }) {
    return this.reviewService.moderateReview(payload.id, payload.dto, payload.actorId);
  }
}
