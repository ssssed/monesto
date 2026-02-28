import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

const DEFAULT_LAYOUT = { widgets: [] };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLayout(userId: string) {
    const layout = await this.prisma.dashboardLayout.findUnique({
      where: { userId },
    });
    const data = layout?.layoutJson as { widgets?: unknown[] } | null;
    return { widgets: data?.widgets ?? DEFAULT_LAYOUT.widgets };
  }

  async putLayout(userId: string, body: { widgets: Array<{ id: string; widgetType: string; position?: number; order?: number }> }) {
    await this.prisma.dashboardLayout.upsert({
      where: { userId },
      create: { userId, layoutJson: body as unknown as Prisma.InputJsonValue },
      update: { layoutJson: body as unknown as Prisma.InputJsonValue },
    });
    return { ok: true };
  }

  async getWidgetData(
    user: User,
    widgetType: string,
    query: { year?: string; month?: string; accountId?: string; tag?: string },
  ) {
    const year = query.year ? parseInt(query.year, 10) : new Date().getFullYear();
    const month = query.month ? parseInt(query.month, 10) : new Date().getMonth() + 1;

    switch (widgetType) {
      case 'income':
        return this.getIncomeWidget(user.id, year, month);
      case 'expenses':
        return this.getExpensesWidget(user.id, year, month);
      case 'balance':
        return this.getBalanceWidget(user.id, year, month);
      case 'free-money':
        return this.getFreeMoneyWidget(user.id, year, month);
      case 'asset-chart':
        return this.getAssetChartWidget(user.id, year, month, query.accountId, query.tag);
      default:
        return { component: 'UnknownWidget', data: {} };
    }
  }

  private async getIncomeWidget(userId: string, year: number, month: number) {
    const incomes = await this.prisma.income.findMany({
      where: { userId, year, month },
      include: { incomeType: true },
    });
    const byType = new Map<string, { amount: number; currency: string }>();
    let total = 0;
    const currency = incomes[0]?.currency ?? 'RUB';
    for (const i of incomes) {
      const amt = Number(i.amount);
      total += amt;
      const key = i.incomeType.name;
      const prev = byType.get(key);
      if (prev) byType.set(key, { amount: prev.amount + amt, currency: i.currency });
      else byType.set(key, { amount: amt, currency: i.currency });
    }
    const breakdown = Array.from(byType.entries()).map(([label, v]) => ({
      label,
      amount: String(v.amount),
      currency: v.currency,
    }));
    return { component: 'IncomeWidget', data: { total: String(total), currency, breakdown } };
  }

  private async getExpensesWidget(userId: string, year: number, month: number) {
    const expenses = await this.prisma.expense.findMany({ where: { userId } });
    const breakdown = expenses.map((e) => ({
      label: e.name,
      amount: String(e.amount),
      currency: e.currency,
    }));
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const currency = expenses[0]?.currency ?? 'RUB';
    return { component: 'ExpensesWidget', data: { total: String(total), currency, breakdown } };
  }

  private async getBalanceWidget(userId: string, year: number, month: number) {
    const [incomes, expenses, movements] = await Promise.all([
      this.prisma.income.findMany({ where: { userId } }),
      this.prisma.expense.findMany({ where: { userId } }),
      this.prisma.movement.findMany({ where: { userId } }),
    ]);
    let pool = 0;
    for (const m of movements) {
      const amt = Number(m.amount);
      if (m.type === 'income') pool += amt;
      else if (m.type === 'expense') pool -= amt;
      else if (m.type === 'pool_to_asset') pool -= amt;
      else if (m.type === 'asset_to_pool') pool += amt;
    }
    const incomeSum = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const expenseSum = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const trend = pool > 0 ? 'up' : pool < 0 ? 'down' : 'neutral';
    return { component: 'BalanceWidget', data: { amount: String(pool), currency: 'RUB', trend } };
  }

  private async getFreeMoneyWidget(userId: string, year: number, month: number) {
    const [incomes, expenses] = await Promise.all([
      this.prisma.income.findMany({ where: { userId, year, month } }),
      this.prisma.expense.findMany({ where: { userId } }),
    ]);
    const incomeSum = incomes.reduce((s, i) => s + Number(i.amount), 0);
    const expenseSum = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const free = Math.max(0, incomeSum - expenseSum);
    return {
      component: 'FreeMoneyWidget',
      data: { amount: String(free), currency: 'RUB', formulaDescription: 'доход за месяц − расходы' },
    };
  }

  private async getAssetChartWidget(
    userId: string,
    year: number,
    month: number,
    accountId?: string,
    tag?: string,
  ) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, ...(accountId ? { id: accountId } : {}), ...(tag ? { tags: { some: { alias: tag } } } : {}) },
      include: { tags: true },
    });
    const acc = accounts[0];
    if (!acc) return { component: 'AssetChart', data: { accountId: '', label: '', currency: '', currentSum: '0', points: [] } };
    const movementsTo = await this.prisma.movement.findMany({
      where: { toAccountId: acc.id },
    });
    const movementsFrom = await this.prisma.movement.findMany({
      where: { fromAccountId: acc.id },
    });
    const byMonth = new Map<string, number>();
    for (const m of movementsTo) {
      const k = `${m.year}-${m.month}`;
      byMonth.set(k, (byMonth.get(k) ?? 0) + Number(m.amount));
    }
    for (const m of movementsFrom) {
      const k = `${m.year}-${m.month}`;
      byMonth.set(k, (byMonth.get(k) ?? 0) - Number(m.amount));
    }
    let sum = 0;
    const points: Array<{ year: number; month: number; sum: number }> = [];
    const keys = Array.from(byMonth.keys()).sort();
    for (const k of keys) {
      const [y, m] = k.split('-').map(Number);
      sum += byMonth.get(k) ?? 0;
      points.push({ year: y, month: m, sum });
    }
    return {
      component: 'AssetChart',
      data: {
        accountId: acc.id,
        label: acc.name,
        currency: acc.currency,
        currentSum: String(sum),
        points,
      },
    };
  }
}
