import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { FinanceService } from '../microservices/finance/finance.service';

@Controller('payments')
export class PublicPaymentGatewayController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
  ) {
    return this.financeService.handlePaymentWebhook(provider, payload);
  }
}
