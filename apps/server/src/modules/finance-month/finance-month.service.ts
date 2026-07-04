import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { Currency, FinanceType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { PatchMonthFinanceDto } from './dto/patch-month-finance.dto';
import { MonthFinanceStep } from './dto/patch-month-finance.dto';
import { getCurrentYearMonth } from './lib/current-year-month';
import { parseFinanceAmount } from './lib/parse-finance-amount';
import {
  mapRecordsToMonthFinanceView,
  resolveMandatoryLines,
} from './finance-month.mapper';

@Injectable()
export class FinanceMonthService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonth(
    userId: number,
    year?: number,
    month?: number,
  ) {
    const period = this.resolvePeriod(year, month);
    const currency = await this.getBaseCurrency(userId);
    const records = await this.findRecords(userId, period.year, period.month);
    const view = mapRecordsToMonthFinanceView(records);

    return {
      year: period.year,
      month: period.month,
      currency,
      ...view,
    };
  }

  async patchMonth(userId: number, dto: PatchMonthFinanceDto, year?: number, month?: number) {
    const period = this.resolvePeriod(year, month);
    const currency = await this.getBaseCurrency(userId);

    if (dto.step === MonthFinanceStep.incoming) {
      await this.saveIncoming(userId, period.year, period.month, currency, dto.value);
    } else {
      await this.saveMandatory(
        userId,
        period.year,
        period.month,
        currency,
        dto.value,
        dto.breakdown,
      );
    }

    return this.getMonth(userId, period.year, period.month);
  }

  private async saveIncoming(
    userId: number,
    year: number,
    month: number,
    currency: Currency,
    value: string | undefined,
  ) {
    const amount = parseFinanceAmount(value ?? '');
    if (amount <= 0) {
      throw new BadRequestException(
        'Для шага incoming поле value должно быть положительным числом',
      );
    }

    await this.replaceRecords(userId, year, month, FinanceType.income, [
      {
        name: null,
        amount: new Prisma.Decimal(amount),
        currency,
      },
    ]);
  }

  private async saveMandatory(
    userId: number,
    year: number,
    month: number,
    currency: Currency,
    value: string | undefined,
    breakdown: PatchMonthFinanceDto['breakdown'],
  ) {
    const resolved = resolveMandatoryLines(value, breakdown);

    if (resolved.mode === 'detailed') {
      await this.replaceRecords(
        userId,
        year,
        month,
        FinanceType.expense,
        resolved.rows.map((line) => ({
          name: line.name,
          amount: new Prisma.Decimal(line.amount),
          currency,
        })),
      );
      return;
    }

    if (resolved.amount <= 0) {
      throw new BadRequestException(
        'Для шага mandatory укажите value или хотя бы одну строку breakdown',
      );
    }

    await this.replaceRecords(userId, year, month, FinanceType.expense, [
      {
        name: null,
        amount: new Prisma.Decimal(resolved.amount),
        currency,
      },
    ]);
  }

  private async replaceRecords(
    userId: number,
    year: number,
    month: number,
    type: FinanceType,
    rows: Array<{
      name: string | null;
      amount: Prisma.Decimal;
      currency: Currency;
    }>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.financeRecord.deleteMany({
        where: { userId, year, month, type },
      });

      if (rows.length === 0) {
        return;
      }

      await tx.financeRecord.createMany({
        data: rows.map((row) => ({
          userId,
          year,
          month,
          type,
          name: row.name,
          amount: row.amount,
          currency: row.currency,
        })),
      });
    });
  }

  private async findRecords(userId: number, year: number, month: number) {
    return this.prisma.financeRecord.findMany({
      where: { userId, year, month },
      orderBy: [{ type: 'asc' }, { id: 'asc' }],
    });
  }

  private resolvePeriod(year?: number, month?: number) {
    if (year == null && month == null) {
      return getCurrentYearMonth();
    }

    if (year == null || month == null) {
      throw new BadRequestException('year и month должны быть указаны вместе');
    }

    return { year, month };
  }

  private async getBaseCurrency(userId: number): Promise<Currency> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { baseCurrency: true },
    });

    return settings?.baseCurrency ?? Currency.usd;
  }
}
