import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ReviewService } from './services/review.service';
import {
  ModerateReviewDto,
  ReviewFilterDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../src/common/guards/roles.guard';
import { Roles } from '../../../../libs/auth/src';
import { UserRole } from '@medcare/contracts';
import type { AuthenticatedRequest } from '../../../../src/common/types/authenticated-request.type';

@ApiTags('Admin Reviews & Ratings')
@ApiBearerAuth('JWT-auth')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminReviewGatewayController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiOperation({
    summary: 'List and filter doctor patient reviews and flagged feedback',
  })
  @ApiResponse({ status: 200, description: 'Reviews list returned' })
  @Get()
  async listReviews(@Query() query: ReviewFilterDto) {
    return this.reviewService.listReviews(query);
  }

  @ApiOperation({
    summary: 'Moderate review (PUBLISH, HIDE, FLAG, DISMISS_FLAG)',
  })
  @ApiResponse({ status: 200, description: 'Review moderation updated' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @Patch(':id/moderate')
  async moderateReview(
    @Param('id') id: string,
    @Body() body: ModerateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.moderateReview(id, body, req.user?.id);
  }
}
