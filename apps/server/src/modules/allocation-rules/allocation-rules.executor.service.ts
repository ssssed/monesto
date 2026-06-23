import { Injectable, Logger } from '@nestjs/common';
import { Currency, type AllocationRule, type Asset } from '@prisma/client';
import {
  getCalendarPeriod,
  getDateColumnDay,
} from '../../shared/lib/calendar-period';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetService } from '../asset/asset.service';
import type {
  AllocationRuleExecutionItem,
  AllocationRulesExecutionResult,
} from './allocation-rules-execution.types';
import { NetIncomeService } from './net-income.service';
import { TopUpCalculationFactory } from './strategies/top-up-calculation.factory';

type RuleWithAsset = AllocationRule & { asset: Asset };

@Injectable()
export class AllocationRulesExecutorService {
  private readonly logger = new Logger(AllocationRulesExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assetService: AssetService,
    private readonly netIncomeService: NetIncomeService,
    private readonly topUpFactory: TopUpCalculationFactory,
  ) {}

  async executeDueRulesForToday(
    referenceDate = new Date(),
  ): Promise<AllocationRulesExecutionResult> {
    const { year, month, day: dayOfMonth } = getCalendarPeriod(referenceDate);

    const rules = await this.prisma.allocationRule.findMany({
      include: { asset: true },
    });

    const dueRules = rules.filter(
      (rule) => getDateColumnDay(rule.executionDate) === dayOfMonth,
    );

    const result: AllocationRulesExecutionResult = {
      dayOfMonth,
      totalRules: rules.length,
      dueRules: dueRules.length,
      executed: 0,
      skipped: 0,
      failed: 0,
      items: [],
    };

    if (dueRules.length === 0) {
      this.logger.log(
        `Нет правил на ${dayOfMonth}-е число (всего правил: ${rules.length})`,
      );
      return result;
    }

    this.logger.log(
      `Выполнение ${dueRules.length} правил на ${dayOfMonth}-е число`,
    );

    const netIncomeByUser = new Map<number, number>();

    for (const rule of dueRules) {
      const item = await this.executeRule(rule, year, month, netIncomeByUser);
      result.items.push(item);

      if (item.status === 'executed') {
        result.executed += 1;
      } else if (item.status === 'skipped') {
        result.skipped += 1;
      } else {
        result.failed += 1;
      }
    }

    return result;
  }

  private async executeRule(
    rule: RuleWithAsset,
    year: number,
    month: number,
    netIncomeByUser: Map<number, number>,
  ): Promise<AllocationRuleExecutionItem> {
    const baseItem = {
      ruleId: rule.id,
      userId: rule.userId,
      assetName: rule.asset.name,
    };

    try {
      const baseCurrency = await this.getBaseCurrency(rule.userId);

      let netIncomeInBase = netIncomeByUser.get(rule.userId);
      if (netIncomeInBase === undefined) {
        netIncomeInBase = await this.netIncomeService.getNetIncomeForMonth(
          rule.userId,
          year,
          month,
        );
        netIncomeByUser.set(rule.userId, netIncomeInBase);
        this.logger.log(
          `userId=${rule.userId}: чистый доход за ${month}.${year} = ${netIncomeInBase}`,
        );
      }

      const strategy = this.topUpFactory.getStrategy(rule.topUpType);
      const calculation = strategy.calculate({
        rule,
        asset: rule.asset,
        baseCurrency,
        netIncomeInBase,
      });

      if (!calculation) {
        const message = 'Расчёт дал нулевой результат';
        this.logger.warn(`Правило #${rule.id}: ${message}, пропуск`);
        return { ...baseItem, status: 'skipped', message };
      }

      await this.assetService.recordTransaction({
        userId: rule.userId,
        assetId: rule.assetId,
        type: calculation.type,
        quantity: calculation.quantity,
        price: calculation.pricePerUnit,
      });

      this.logger.log(
        `Правило #${rule.id}: ${calculation.type} ${calculation.quantity} × ${calculation.pricePerUnit} (${rule.asset.name})`,
      );

      return {
        ...baseItem,
        status: 'executed',
        transactionType: calculation.type,
        quantity: calculation.quantity,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Ошибка при выполнении правила #${rule.id} (userId=${rule.userId})`,
        error instanceof Error ? error.stack : String(error),
      );
      return { ...baseItem, status: 'failed', message };
    }
  }

  private async getBaseCurrency(userId: number): Promise<Currency> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { baseCurrency: true },
    });
    return settings?.baseCurrency ?? Currency.usd;
  }
}
