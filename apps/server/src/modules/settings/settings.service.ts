import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateBaseCurrency(userId: number, baseCurrency: Currency) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, baseCurrency },
      update: { baseCurrency },
    });
  }

  /**
   * Удаляет все активы пользователя, транзакции по ним и записи positions.
   */
  async clearAssetsPortfolio(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const { count: transactionsDeleted } = await tx.transaction.deleteMany({
        where: { userId },
      });
      const { count: positionsDeleted } = await tx.position.deleteMany({
        where: { userId },
      });
      const { count: assetsDeleted } = await tx.asset.deleteMany({
        where: { userId },
      });
      return {
        ok: true as const,
        deleted: {
          transactions: transactionsDeleted,
          positions: positionsDeleted,
          assets: assetsDeleted,
        },
      };
    });
  }
}
