import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '@medcare/contracts';
import { FinanceService } from './finance.service';
import {
  ProcessRefundDto,
  TransactionFilterDto,
  PatientPaymentDto,
} from './dto/finance.dto';

@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @MessagePattern(PATTERNS.FINANCE.LIST_TRANSACTIONS)
  async listTransactions(@Payload() filter: TransactionFilterDto) {
    return this.financeService.listTransactions(filter);
  }

  @MessagePattern(PATTERNS.FINANCE.PROCESS_REFUND)
  async processRefund(
    @Payload() payload: { id: string; dto: ProcessRefundDto; actorId?: string },
  ) {
    return this.financeService.processRefund(
      payload.id,
      payload.dto,
      payload.actorId,
    );
  }

  @MessagePattern(PATTERNS.FINANCE.GET_REPORT)
  async getFinanceSummary() {
    return this.financeService.getFinanceSummary();
  }

  // --- Patient Portal Message Patterns ---

  @MessagePattern(PATTERNS.FINANCE.PATIENT_SUMMARY)
  async patientSummary(@Payload() payload: { userId: string }) {
    return this.financeService.patientGetSummary(payload.userId);
  }

  @MessagePattern(PATTERNS.FINANCE.PATIENT_INVOICES)
  async patientInvoices(
    @Payload()
    payload: {
      userId: string;
      filter: { page?: number; limit?: number };
    },
  ) {
    return this.financeService.patientListInvoices(
      payload.userId,
      payload.filter,
    );
  }

  @MessagePattern(PATTERNS.FINANCE.PATIENT_PAY)
  async patientPay(
    @Payload() payload: { userId: string; dto: PatientPaymentDto },
  ) {
    return this.financeService.patientPayAppointment(
      payload.userId,
      payload.dto,
    );
  }
}
