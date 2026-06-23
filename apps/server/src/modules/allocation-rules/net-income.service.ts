import { FinanceType, Currency, type Currency as CurrencyType } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrencyConverterFactory } from '../asset/profit/currency-converter.factory';
import { calculateNetIncome } from './net-income.calc';

@Injectable()
export class NetIncomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly converters: CurrencyConverterFactory,
  ) {}

  /**
   * Чистый доход за месяц в базовой валюте пользователя: income − expense.
   */
  async getNetIncomeForMonth(
    userId: number,
    year: number,
    month: number,
  ): Promise<number> {
    const [records, baseCurrency] = await Promise.all([
      this.prisma.financeRecord.findMany({
        where: { userId, year, month },
        select: { type: true, name: true, amount: true, currency: true },
      }),
      this.getBaseCurrency(userId),
    ]);

    return calculateNetIncome(
      records.map((record) => ({
        type: record.type,
        name: record.name,
        amount: this.converters.convert(
          Number(record.amount),
          record.currency,
          baseCurrency,
        ),
      })),
    );
  }

  private async getBaseCurrency(userId: number): Promise<CurrencyType> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { baseCurrency: true },
    });
    return settings?.baseCurrency ?? Currency.usd;
  }
}
