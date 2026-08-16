import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { FinanceService } from '../microservices/finance/finance.service';

@ApiTags('Public Payments & Webhooks')
@Controller('payments')
export class PublicPaymentGatewayController {
  constructor(private readonly financeService: FinanceService) {}

  @ApiOperation({ summary: 'Handle incoming asynchronous payment provider webhook callbacks (Stripe, SSLCommerz, etc.)' })
  @ApiResponse({ status: 200, description: 'Webhook event processed and verified' })
  @ApiParam({ name: 'provider', example: 'stripe', description: 'Provider identifier (stripe, sslcommerz, bkash)' })
  @ApiBody({ description: 'Raw webhook payload from payment gateway', type: Object })
  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
  ) {
    return this.financeService.handlePaymentWebhook(provider, payload);
  }
}
