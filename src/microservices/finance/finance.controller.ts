import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../common/microservices.constants';
import { FinanceService } from './finance.service';
import { ProcessRefundDto, TransactionFilterDto } from './dto/finance.dto';

@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @MessagePattern(PATTERNS.FINANCE.LIST_TRANSACTIONS)
  async listTransactions(@Payload() filter: TransactionFilterDto) {
    return this.financeService.listTransactions(filter);
  }

  @MessagePattern(PATTERNS.FINANCE.PROCESS_REFUND)
  async processRefund(@Payload() payload: { id: string; dto: ProcessRefundDto; actorId?: string }) {
    return this.financeService.processRefund(payload.id, payload.dto, payload.actorId);
  }

  @MessagePattern(PATTERNS.FINANCE.GET_REPORT)
  async getSummary() {
    return this.financeService.getFinanceSummary();
  }
}
