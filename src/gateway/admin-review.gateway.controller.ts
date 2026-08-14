import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ReviewService } from '../microservices/review/review.service';
import { ModerateReviewDto, ReviewFilterDto } from '../microservices/review/dto/review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminReviewGatewayController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async listReviews(@Query() query: ReviewFilterDto) {
    return this.reviewService.listReviews(query);
  }

  @Patch(':id/moderate')
  async moderateReview(
    @Param('id') id: string,
    @Body() body: ModerateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.moderateReview(id, body, req.user?.id);
  }
}
