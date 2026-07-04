import { Module } from '@nestjs/common';
import { AssetModule } from '../asset/asset.module';
import { AuthModule } from '../auth/auth.module';
import { AllocationRulesController } from './allocation-rules.controller';
import { AllocationRulesCron } from './allocation-rules.cron';
import { AllocationRulesExecutorService } from './allocation-rules.executor.service';
import { AllocationRulesService } from './allocation-rules.service';
import { NetIncomeService } from './net-income.service';
import { FixedAmountTopUpStrategy } from './strategies/fixed-amount-top-up.strategy';
import { PercentTopUpStrategy } from './strategies/percent-top-up.strategy';
import { QuantityTopUpStrategy } from './strategies/quantity-top-up.strategy';
import { TopUpCalculationFactory } from './strategies/top-up-calculation.factory';

@Module({
  imports: [AuthModule, AssetModule],
  controllers: [AllocationRulesController],
  exports: [AllocationRulesExecutorService],
  providers: [
    AllocationRulesService,
    AllocationRulesExecutorService,
    AllocationRulesCron,
    NetIncomeService,
    PercentTopUpStrategy,
    FixedAmountTopUpStrategy,
    QuantityTopUpStrategy,
    TopUpCalculationFactory,
  ],
})
export class AllocationRulesModule {}
