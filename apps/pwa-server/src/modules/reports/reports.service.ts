import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssetProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { FxRateService } from '../fx/fx-rate.service';
import {
  calculateReport,
  ReportCalculationError,
} from './calc/calculate-report';
import type {
  AllocationStatus,
  ReportCycleDto,
  ReportResultDto,
} from './calc/dto';
import {
  findPrimaryIncome,
  parseDate,
  scheduleDaysFromPrimary,
  listReportCycles,
} from './calc/date-window';
import { toIsoDate } from './calc/vacation-pay';
import { computeYearSummary, type YearSummary } from './calc/year-summary';
import {
  summarizeDraftRulesBudget,
  summarizeRulesBudget,
  type RulesBudgetSummary,
} from './calc/rules-budget';
import {
  mapAsset,
  mapAssetTransaction,
  mapDistributionRule,
  mapExpense,
  mapIncomeSource,
  mapVacationPeriod,
} from './calc/prisma-mappers';
import type {
  AssetCalc,
  DistributionRuleCalc,
  ExpenseCalc,
  IncomeSourceCalc,
  VacationPeriodCalc,
} from './calc/types';
import { DraftRulesBudgetDto } from './dto/draft-rules-budget.dto';
import { GetCurrentReportQueryDto } from './dto/get-current-report-query.dto';
import { GetCyclesQueryDto } from './dto/get-cycles-query.dto';
import { GetRulesBudgetQueryDto } from './dto/get-rules-budget-query.dto';
import { GetYearSummaryQueryDto } from './dto/get-year-summary-query.dto';

/** open.er-api не отвечает / курс ещё не загружен — тот же fallback, что был у клиента. */
const FALLBACK_USD_RUB = 82;

/** Query-параметры дат приходят как YYYY-MM-DD; на всякий случай отрезаем время, если пришёл полный ISO. */
function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

interface UserFinanceData {
  incomes: IncomeSourceCalc[];
  expenses: ExpenseCalc[];
  rules: DistributionRuleCalc[];
  assets: AssetCalc[];
  vacations: VacationPeriodCalc[];
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fxRateService: FxRateService,
    private readonly assetsService: AssetsService,
  ) {}

  async getCurrentReport(
    userId: number,
    query: GetCurrentReportQueryDto,
  ): Promise<ReportResultDto> {
    const data = await this.loadUserFinanceData(userId);
    const usdRubRate = await this.resolveUsdRubRate();
    const today = query.today ? parseDate(toDateOnly(query.today)) : new Date();

    const calc = this.runCalculateReport({
      ...data,
      today,
      usdRubRate,
      cyclePaymentDay: query.cyclePaymentDay,
      cycleNominalDate: query.cycleNominalDate
        ? parseDate(toDateOnly(query.cycleNominalDate))
        : undefined,
    });

    const statuses = await this.getAllocationStatuses(
      userId,
      calc.cycleKey,
      calc.allocations.map((a) => a.ruleId),
    );

    return {
      ...calc,
      allocations: calc.allocations.map((allocation) => ({
        ...allocation,
        status: statuses.get(allocation.ruleId) ?? 'pending',
      })),
    };
  }

  async listCycles(
    userId: number,
    query: GetCyclesQueryDto,
  ): Promise<ReportCycleDto[]> {
    const data = await this.loadUserFinanceData(userId);
    const primary = findPrimaryIncome(data.incomes);
    if (!primary) {
      throw new BadRequestException({
        code: 'NO_PRIMARY_SALARY',
        message: 'Не указана основная зарплата',
      });
    }

    const scheduleDays = scheduleDaysFromPrimary(primary);
    const today = query.today ? parseDate(toDateOnly(query.today)) : new Date();
    const vacationCtx =
      primary.incomeKind === 'bimonthly_salary' && data.vacations.length
        ? {
            vacations: data.vacations,
            monthlyAmount: primary.monthlyAmount ?? 0,
            tranches: primary.salaryTranches,
          }
        : undefined;

    return listReportCycles(today, scheduleDays, vacationCtx).map((cycle) => ({
      paymentDay: cycle.paymentDay,
      nominalDate: toIsoDate(cycle.nominalDate),
      payoutDate: toIsoDate(cycle.payoutDate),
      isPreview: cycle.isPreview,
    }));
  }

  async getYearSummary(
    userId: number,
    query: GetYearSummaryQueryDto,
  ): Promise<YearSummary> {
    const assetRows = await this.prisma.asset.findMany({ where: { userId } });
    const assetIds = assetRows.map((a) => a.id);
    const transactionRows = assetIds.length
      ? await this.prisma.assetTransaction.findMany({
          where: { assetId: { in: assetIds } },
        })
      : [];
    const usdRubRate = await this.resolveUsdRubRate();
    const now = query.now ? parseDate(toDateOnly(query.now)) : new Date();

    return computeYearSummary({
      assets: assetRows.map(mapAsset),
      transactions: transactionRows.map(mapAssetTransaction),
      usdRubRate,
      now,
    });
  }

  async getRulesBudget(
    userId: number,
    query: GetRulesBudgetQueryDto,
  ): Promise<RulesBudgetSummary> {
    const data = await this.loadUserFinanceData(userId);
    const usdRubRate = await this.resolveUsdRubRate();
    const today = query.today ? parseDate(toDateOnly(query.today)) : new Date();
    const remainder = this.resolveRemainderForBudgetPreview(
      data,
      today,
      usdRubRate,
    );

    const rules =
      query.excludeRuleId == null
        ? data.rules
        : data.rules.filter((r) => r.id !== query.excludeRuleId);

    return summarizeRulesBudget({
      remainder,
      rules,
      assets: data.assets,
      usdRubRate,
    });
  }

  async getDraftRulesBudget(
    userId: number,
    dto: DraftRulesBudgetDto,
  ): Promise<RulesBudgetSummary> {
    const data = await this.loadUserFinanceData(userId);
    const usdRubRate = await this.resolveUsdRubRate();
    const today = dto.today ? parseDate(toDateOnly(dto.today)) : new Date();
    const remainder = this.resolveRemainderForBudgetPreview(
      data,
      today,
      usdRubRate,
    );

    return summarizeDraftRulesBudget({
      remainder,
      rules: data.rules,
      assets: data.assets,
      usdRubRate,
      draft: {
        id: dto.id,
        name: dto.name,
        ruleType: dto.ruleType,
        value: dto.value,
        currency: dto.currency,
        targetAssetId: dto.targetAssetId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        creditEarlyRepayMode: dto.creditEarlyRepayMode ?? null,
      },
    });
  }

  /**
   * Подтверждает аллокацию правила на конкретный цикл: сумма всегда
   * пересчитывается сервером на момент подтверждения (клиентской сумме не
   * доверяем), затем реально переводит деньги на целевой актив через
   * AssetsService (для кредита — с пересчётом досрочки).
   */
  async confirmAllocation(userId: number, ruleId: number, cycleKey: string) {
    const rule = await this.prisma.distributionRule.findFirst({
      where: { id: ruleId, userId },
    });
    if (!rule) {
      throw new NotFoundException('Правило распределения не найдено');
    }

    const existingRejection = await this.prisma.allocationRejection.findUnique({
      where: { ruleId_cycleKey: { ruleId, cycleKey } },
    });
    if (existingRejection) return { status: 'already_rejected' as const };

    const existingConfirmation =
      await this.prisma.allocationConfirmation.findUnique({
        where: { ruleId_cycleKey: { ruleId, cycleKey } },
      });
    if (existingConfirmation) return { status: 'already_confirmed' as const };

    const { calc, data, usdRubRate } = await this.computeReportForCycleKey(
      userId,
      cycleKey,
    );
    const allocation = calc.allocations.find((a) => a.ruleId === ruleId);
    if (!allocation) {
      throw new BadRequestException(
        'Не удалось вычислить сумму аллокации для указанного цикла',
      );
    }

    try {
      await this.prisma.allocationConfirmation.create({
        data: { userId, ruleId, cycleKey, amountRub: allocation.amountRub },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { status: 'already_confirmed' as const };
      }
      throw error;
    }

    let transaction: Awaited<
      ReturnType<AssetsService['createTransaction']>
    > | null = null;
    if (rule.targetAssetId != null) {
      const targetAsset = data.assets.find((a) => a.id === rule.targetAssetId);
      const amountDelta =
        targetAsset?.provider === AssetProvider.usd
          ? allocation.amountRub / usdRubRate
          : allocation.amountRub;

      transaction = await this.assetsService.createTransaction(
        rule.targetAssetId,
        userId,
        {
          amountDelta,
          note: 'Погашение из отчёта',
          costRub: allocation.amountRub,
          earlyRepayMode: rule.creditEarlyRepayMode ?? undefined,
        },
      );
    }

    return {
      status: 'ok' as const,
      amountRub: allocation.amountRub,
      transaction,
    };
  }

  async rejectAllocation(userId: number, ruleId: number, cycleKey: string) {
    const rule = await this.prisma.distributionRule.findFirst({
      where: { id: ruleId, userId },
    });
    if (!rule) {
      throw new NotFoundException('Правило распределения не найдено');
    }

    const existingConfirmation =
      await this.prisma.allocationConfirmation.findUnique({
        where: { ruleId_cycleKey: { ruleId, cycleKey } },
      });
    if (existingConfirmation) return { status: 'already_confirmed' as const };

    const existingRejection = await this.prisma.allocationRejection.findUnique({
      where: { ruleId_cycleKey: { ruleId, cycleKey } },
    });
    if (existingRejection) return { status: 'already_rejected' as const };

    try {
      await this.prisma.allocationRejection.create({
        data: { userId, ruleId, cycleKey },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return { status: 'already_rejected' as const };
      }
      throw error;
    }

    return { status: 'ok' as const };
  }

  private async computeReportForCycleKey(userId: number, cycleKey: string) {
    const data = await this.loadUserFinanceData(userId);
    const usdRubRate = await this.resolveUsdRubRate();
    const calc = this.runCalculateReport({
      ...data,
      today: new Date(),
      usdRubRate,
      cycleNominalDate: parseDate(cycleKey),
    });
    return { calc, data, usdRubRate };
  }

  private async loadUserFinanceData(userId: number): Promise<UserFinanceData> {
    const [incomes, expenses, rules, assets, vacations] = await Promise.all([
      this.prisma.incomeSource.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId } }),
      this.prisma.distributionRule.findMany({ where: { userId } }),
      this.prisma.asset.findMany({ where: { userId } }),
      this.prisma.vacationPeriod.findMany({ where: { userId } }),
    ]);

    return {
      incomes: incomes.map(mapIncomeSource),
      expenses: expenses.map(mapExpense),
      rules: rules.map(mapDistributionRule),
      assets: assets.map(mapAsset),
      vacations: vacations.map(mapVacationPeriod),
    };
  }

  private async resolveUsdRubRate(): Promise<number> {
    try {
      const rate = await this.fxRateService.getLatest('USD', 'RUB');
      return Number(rate.rate);
    } catch {
      return FALLBACK_USD_RUB;
    }
  }

  private runCalculateReport(input: Parameters<typeof calculateReport>[0]) {
    try {
      return calculateReport(input);
    } catch (error) {
      if (error instanceof ReportCalculationError) {
        throw new BadRequestException({
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }

  /**
   * Remainder для превью бюджета правил — как в исходном RulesScreen/RuleFormScreen:
   * при отсутствии основной зарплаты (или другой ошибке расчёта) используется
   * фиксированный запасной остаток вместо падения экрана.
   */
  private resolveRemainderForBudgetPreview(
    data: UserFinanceData,
    today: Date,
    usdRubRate: number,
  ): number {
    try {
      return calculateReport({ ...data, today, usdRubRate }).remainder;
    } catch {
      return 100_000;
    }
  }

  private async getAllocationStatuses(
    userId: number,
    cycleKey: string,
    ruleIds: number[],
  ): Promise<Map<number, AllocationStatus>> {
    const map = new Map<number, AllocationStatus>();
    if (!ruleIds.length) return map;

    const [confirmations, rejections] = await Promise.all([
      this.prisma.allocationConfirmation.findMany({
        where: { userId, cycleKey, ruleId: { in: ruleIds } },
      }),
      this.prisma.allocationRejection.findMany({
        where: { userId, cycleKey, ruleId: { in: ruleIds } },
      }),
    ]);

    for (const confirmation of confirmations)
      map.set(confirmation.ruleId, 'confirmed');
    for (const rejection of rejections) map.set(rejection.ruleId, 'rejected');
    return map;
  }
}
