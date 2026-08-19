import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@medcare/shared';

@ApiTags('Billing, Invoices & Payments')
@Controller()
export class BillingGatewayController {
  constructor(
    @Inject(MICROSERVICES.BILLING) private readonly billingClient: ClientProxy,
  ) {}

  // --- Admin Finance ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all transactions' })
  @Get('admin/finance/transactions')
  async adminListTransactions(@Query() query: any) {
    return this.billingClient.send(PATTERNS.BILLING.LIST_TRANSACTIONS, query);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin process refund' })
  @Post('admin/finance/transactions/:id/refund')
  async adminProcessRefund(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.billingClient.send(PATTERNS.BILLING.PROCESS_REFUND, {
      transactionId: id,
      dto: body,
      adminId: req.user?.id,
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get financial overview report' })
  @Get('admin/finance/reports')
  async adminGetReport(@Query() query: any) {
    return this.billingClient.send(PATTERNS.BILLING.GET_REPORT, query);
  }

  // --- Patient Invoices ---
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Patient get invoices' })
  @Get('patient/payments')
  async patientGetInvoices(@Req() req: any) {
    return this.billingClient.send(
      PATTERNS.BILLING.PATIENT_INVOICES,
      req.user.id,
    );
  }

  // --- Public Payment Webhooks ---
  @Public()
  @ApiOperation({ summary: 'Payment provider webhook endpoint' })
  @Post('payments/webhook/:provider')
  async paymentWebhook(@Param('provider') provider: string, @Body() body: any) {
    return this.billingClient.send(PATTERNS.BILLING.PATIENT_PAY, {
      provider,
      payload: body,
    });
  }
}
