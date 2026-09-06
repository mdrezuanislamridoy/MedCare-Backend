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
  ApiBody,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Public,
  RateLimitTier,
  ApiRateLimitTier,
  SkipRateLimit,
} from '@medcare/shared';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import {
  PatientPaymentDto,
  ProcessRefundDto,
  TransactionFilterDto,
} from '../../../../billing-service/src/billing/dto/finance.dto';

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
  @ApiOperation({ summary: 'Admin get financial summary' })
  @Get('admin/finance/summary')
  async adminGetFinanceSummary() {
    return this.billingClient
      .send('billing.summary.get', {})
      .pipe(
        timeout(4000),
        catchError(() =>
          of({
            totalRevenue: 0,
            platformCommission: 0,
            pendingPayouts: 0,
            completedPayouts: 0,
          }),
        ),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list all transactions' })
  @Get('admin/finance/transactions')
  async adminListTransactions(@Query() query: TransactionFilterDto) {
    return this.billingClient
      .send(PATTERNS.BILLING.LIST_TRANSACTIONS, query)
      .pipe(
        timeout(4000),
        catchError(() =>
          of({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
        ),
      );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin list payout requests' })
  @Get('admin/finance/payouts')
  async adminListPayouts(@Query() query: any) {
    return { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin approve or reject payout' })
  @Post('admin/finance/payouts/:id/action')
  async adminDecidePayout(@Param('id') id: string, @Body() body: any) {
    return { success: true, id, action: body.action, notes: body.notes };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RateLimitTier(ApiRateLimitTier.PAYMENT)
  @ApiOperation({ summary: 'Admin process refund' })
  @ApiBody({ type: ProcessRefundDto })
  @Post('admin/finance/transactions/:id/refund')
  async adminProcessRefund(
    @Param('id') id: string,
    @Body() body: ProcessRefundDto,
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
  async adminGetReport(@Query() query: TransactionFilterDto) {
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
  @SkipRateLimit()
  @ApiOperation({ summary: 'Payment provider webhook endpoint' })
  @ApiBody({ type: PatientPaymentDto })
  @Post('payments/webhook/:provider')
  async paymentWebhook(
    @Param('provider') provider: string,
    @Body() body: PatientPaymentDto,
  ) {
    return this.billingClient.send(PATTERNS.BILLING.PATIENT_PAY, {
      provider,
      payload: body,
    });
  }
}
