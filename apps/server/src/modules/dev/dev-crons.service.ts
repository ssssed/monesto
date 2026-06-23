import { Injectable } from '@nestjs/common';
import type { AllocationRulesExecutionResult } from '../allocation-rules/allocation-rules-execution.types';
import { AllocationRulesExecutorService } from '../allocation-rules/allocation-rules.executor.service';

export interface DevCronsRunResult {
  runAt: string;
  referenceDate: string;
  jobs: {
    allocationRules: AllocationRulesExecutionResult;
  };
}

@Injectable()
export class DevCronsService {
  constructor(
    private readonly allocationRulesExecutor: AllocationRulesExecutorService,
  ) {}

  async runAllForToday(referenceDate = new Date()): Promise<DevCronsRunResult> {
    const allocationRules =
      await this.allocationRulesExecutor.executeDueRulesForToday(referenceDate);

    return {
      runAt: new Date().toISOString(),
      referenceDate: referenceDate.toISOString(),
      jobs: {
        allocationRules,
      },
    };
  }
}
