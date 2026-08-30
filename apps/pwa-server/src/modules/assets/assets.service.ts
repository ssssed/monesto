import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Asset,
  AssetProvider,
  CreditEarlyRepayMode,
  Expense,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  applyEarlyRepayment,
  creditRemainingMonthsFromSchedule,
  creditScheduleContext,
  resolveRemainingMonthsForRecalc,
  roundMoney,
} from '../reports/calc/credit-plan';
import { mapAsset } from '../reports/calc/prisma-mappers';
import { CreateAssetTransactionDto } from './dto/create-asset-transaction.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.asset.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number, userId: number) {
    return this.findOwnedOrThrow(id, userId);
  }

  async create(dto: CreateAssetDto, userId: number) {
    await this.ensureLinkedExpenseOwnership(dto.linkedExpenseId, userId);
    return this.prisma.asset.create({
      data: {
        userId,
        ...dto,
        creditStartDate: dto.creditStartDate
          ? new Date(dto.creditStartDate)
          : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateAssetDto, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.ensureLinkedExpenseOwnership(dto.linkedExpenseId, userId);
    return this.prisma.asset.update({
      where: { id },
      data: {
        ...dto,
        creditStartDate: dto.creditStartDate
          ? new Date(dto.creditStartDate)
          : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.prisma.asset.delete({ where: { id } });
    return { ok: true as const };
  }

  async getTransactions(assetId: number, userId: number) {
    await this.findOwnedOrThrow(assetId, userId);
    return this.prisma.assetTransaction.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTransaction(
    assetId: number,
    userId: number,
    dto: CreateAssetTransactionDto,
  ) {
    const asset = await this.findOwnedOrThrow(assetId, userId);
    const now = new Date();

    if (asset.provider === AssetProvider.credit) {
      return this.createCreditTransaction(asset, userId, dto, now);
    }
    return this.createSimpleTransaction(asset, dto);
  }

  /** rub/usd/gold/steam: обновляет currentAmount и себестоимость (costBasisRub). */
  private async createSimpleTransaction(
    asset: Asset,
    dto: CreateAssetTransactionDto,
  ) {
    let costDelta = dto.costRub ?? 0;
    if (dto.costRub == null) {
      const currentAmount = Number(asset.currentAmount);
      if (asset.provider === AssetProvider.rub) {
        costDelta = dto.amountDelta;
      } else if (
        asset.provider === AssetProvider.usd &&
        dto.amountDelta < 0 &&
        currentAmount > 0
      ) {
        // Списание USD — средняя себестоимость на единицу.
        const avgCostPerUnit = Number(asset.costBasisRub) / currentAmount;
        costDelta = avgCostPerUnit * dto.amountDelta;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.assetTransaction.create({
        data: {
          assetId: asset.id,
          amountDelta: dto.amountDelta,
          note: dto.note,
          costRub: costDelta || null,
        },
      });
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          currentAmount: { increment: dto.amountDelta },
          costBasisRub: Math.max(0, Number(asset.costBasisRub) + costDelta),
        },
      });
      return transaction;
    });
  }

  /**
   * Кредит: положительная сумма — погашение (может уйти в набежавшие проценты
   * и пересчитать досрочку), отрицательная — увеличение долга.
   */
  private async createCreditTransaction(
    asset: Asset,
    userId: number,
    dto: CreateAssetTransactionDto,
    now: Date,
  ) {
    if (dto.amountDelta < 0) {
      const add = Math.abs(dto.amountDelta);
      return this.prisma.$transaction(async (tx) => {
        const transaction = await tx.assetTransaction.create({
          data: {
            assetId: asset.id,
            amountDelta: add,
            note: dto.note ?? 'Увеличение долга',
            costRub: null,
          },
        });
        await tx.asset.update({
          where: { id: asset.id },
          data: { currentAmount: { increment: add } },
        });
        return transaction;
      });
    }

    const pay = Math.abs(dto.amountDelta);
    const debtBefore = Number(asset.currentAmount);
    const rate =
      asset.creditAnnualRate != null ? Number(asset.creditAnnualRate) : null;
    const mode =
      dto.earlyRepayMode ??
      asset.creditEarlyRepayMode ??
      CreditEarlyRepayMode.reduce_term;
    const expense = await this.resolveLinkedExpense(asset, userId);

    let toPrincipal = pay;
    let newDebt = Math.max(0, roundMoney(debtBefore - pay));
    let newPayment: number | null = null;
    let newMonthsLeft: number | null | undefined;

    if (rate != null && rate > 0 && expense != null) {
      const monthlyPayment = Number(expense.amount);
      const schedule = creditScheduleContext(
        mapAsset(asset),
        expense.dueDay,
        now,
      );
      const monthsBefore = resolveRemainingMonthsForRecalc(
        debtBefore,
        monthlyPayment,
        rate,
        asset.creditRemainingMonths,
        schedule,
      );

      if (
        monthsBefore != null &&
        monthsBefore > 0 &&
        monthlyPayment > 0 &&
        debtBefore > 0
      ) {
        const result = applyEarlyRepayment({
          remainingDebt: debtBefore,
          extraPayment: pay,
          monthlyPayment,
          annualPercent: rate,
          mode,
          remainingMonths: monthsBefore,
          dueDay: expense.dueDay,
          onDate: now,
        });
        toPrincipal = result.toPrincipal;
        newDebt = result.newDebt;

        if (
          mode === CreditEarlyRepayMode.reduce_payment &&
          result.newPayment >= 0
        ) {
          newPayment = result.newPayment;
          newMonthsLeft = schedule
            ? creditRemainingMonthsFromSchedule({
                startDate: schedule.startDate,
                termMonths: schedule.termMonths,
                paymentDay: schedule.paymentDay,
                asOf: now,
              })
            : result.newMonthsLeft;
        } else if (mode === CreditEarlyRepayMode.reduce_term) {
          newMonthsLeft = result.newMonthsLeft;
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.assetTransaction.create({
        data: {
          assetId: asset.id,
          amountDelta: -toPrincipal,
          note: dto.note ?? 'Погашение',
          costRub: pay,
        },
      });
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          currentAmount: newDebt,
          ...(newMonthsLeft !== undefined
            ? { creditRemainingMonths: newMonthsLeft }
            : {}),
        },
      });
      if (newPayment != null && expense) {
        await tx.expense.update({
          where: { id: expense.id },
          data: { amount: newPayment },
        });
      }
      return transaction;
    });
  }

  private async resolveLinkedExpense(
    asset: Asset,
    userId: number,
  ): Promise<Expense | null> {
    if (asset.linkedExpenseId != null) {
      return this.prisma.expense.findFirst({
        where: { id: asset.linkedExpenseId, userId },
      });
    }
    return this.prisma.expense.findFirst({
      where: { linkedAssetId: asset.id, userId },
    });
  }

  private async ensureLinkedExpenseOwnership(
    linkedExpenseId: number | undefined,
    userId: number,
  ) {
    if (linkedExpenseId === undefined) return;
    const expense = await this.prisma.expense.findFirst({
      where: { id: linkedExpenseId, userId },
    });
    if (!expense) {
      throw new BadRequestException(
        'linkedExpenseId ссылается на несуществующий расход',
      );
    }
  }

  private async findOwnedOrThrow(id: number, userId: number) {
    const asset = await this.prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) {
      throw new NotFoundException('Актив не найден');
    }
    return asset;
  }
}
