import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FinanceService } from '../microservices/finance/finance.service';
import { ProcessRefundDto, TransactionFilterDto } from '../microservices/finance/dto/finance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.type';

@ApiTags('Admin Finance & Transactions')
@ApiBearerAuth('JWT-auth')
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminFinanceGatewayController {
  constructor(private readonly financeService: FinanceService) {}

  @ApiOperation({ summary: 'List and filter platform transactions' })
  @ApiResponse({ status: 200, description: 'Transactions list returned' })
  @Get('transactions')
  async listTransactions(@Query() query: TransactionFilterDto) {
    return this.financeService.listTransactions(query);
  }

  @ApiOperation({ summary: 'Process full or partial refund for a transaction' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @Post('transactions/:id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body() body: ProcessRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.processRefund(id, body, req.user?.id);
  }

  @ApiOperation({ summary: 'Get financial reports and revenue breakdown' })
  @ApiResponse({ status: 200, description: 'Finance summary returned' })
  @Get('summary')
  async getSummary() {
    return this.financeService.getFinanceSummary();
  }
}
