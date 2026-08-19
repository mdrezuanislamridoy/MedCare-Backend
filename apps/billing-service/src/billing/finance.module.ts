import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
