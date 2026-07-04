import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AllocationRulesExecutorService } from './allocation-rules.executor.service';

@Injectable()
export class AllocationRulesCron {
  private readonly logger = new Logger(AllocationRulesCron.name);

  constructor(
    private readonly executor: AllocationRulesExecutorService,
  ) {}

  @Cron('0 15 * * *', { timeZone: 'Europe/Moscow' })
  async handleDailyExecution(): Promise<void> {
    this.logger.log('Запуск ежедневного выполнения правил распределения');
    await this.executor.executeDueRulesForToday();
  }
}
