import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceMonthController } from './finance-month.controller';
import { FinanceMonthService } from './finance-month.service';

@Module({
  imports: [AuthModule],
  controllers: [FinanceMonthController],
  providers: [FinanceMonthService],
  exports: [FinanceMonthService],
})
export class FinanceMonthModule {}
