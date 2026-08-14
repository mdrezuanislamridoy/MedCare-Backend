import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { AnalyticsService } from './analytics.service';

@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern(PATTERNS.ANALYTICS.GET_OVERVIEW)
  async getOverview() {
    return this.analyticsService.getOverview();
  }
}
