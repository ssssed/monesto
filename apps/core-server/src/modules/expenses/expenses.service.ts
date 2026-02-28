import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: { year?: number; month?: number }) {
    const where: Prisma.ExpenseWhereInput = { userId };
    return this.prisma.expense.findMany({ where });
  }

  async findOne(userId: string, id: string) {
    const e = await this.prisma.expense.findFirst({ where: { id, userId } });
    if (!e) throw new NotFoundException('Expense not found');
    return e;
  }

  async create(userId: string, body: { name: string; amount: number; currency: string; periodicity: 'on_advance' | 'on_salary' | 'monthly' }) {
    const expense = await this.prisma.expense.create({
      data: {
        userId,
        name: body.name,
        amount: new Prisma.Decimal(body.amount),
        currency: body.currency,
        periodicity: body.periodicity,
      },
    });
    const now = new Date();
    await this.prisma.movement.create({
      data: {
        userId,
        type: 'expense',
        amount: new Prisma.Decimal(body.amount),
        currency: body.currency,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        expenseId: expense.id,
      },
    });
    return expense;
  }

  async update(
    userId: string,
    id: string,
    body: { name?: string; amount?: number; currency?: string; periodicity?: 'on_advance' | 'on_salary' | 'monthly' },
  ) {
    await this.findOne(userId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.amount != null && { amount: new Prisma.Decimal(body.amount) }),
        ...(body.currency != null && { currency: body.currency }),
        ...(body.periodicity != null && { periodicity: body.periodicity }),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.movement.deleteMany({ where: { expenseId: id } });
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true };
  }
}
