import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Currency,
  Prisma,
  TransactionType,
  type Asset,
  type AssetIcon,
  type Position,
  type Transaction,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { generateSlug } from '../../shared/lib/slug';
import { CreateAssetTransactionDto } from './dto/create-asset-transaction.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { type AssetPeriod } from './dto/get-asset-transactions-query.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ProfitCalculatorService } from './profit/profit-calculator.service';

type AssetWithRelations = Asset & {
  assetIcon: AssetIcon | null;
  transactions: Transaction[];
};

@Injectable()
export class AssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profitCalculator: ProfitCalculatorService,
  ) {}

  async findAll(userId: number) {
    const baseCurrency = await this.getBaseCurrency(userId);
    const assets = await this.prisma.asset.findMany({
      where: { userId },
      include: {
        assetIcon: true,
        transactions: {
          where: { userId },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    const assetIds = assets.map((a) => a.id);
    const positions =
      assetIds.length === 0
        ? []
        : await this.prisma.position.findMany({
            where: { userId, assetId: { in: assetIds } },
          });
    const positionByAssetId = new Map(
      positions.map((p) => [p.assetId, p] as const),
    );

    return assets.map((asset) =>
      this.mapAssetResponse(
        asset,
        baseCurrency,
        positionByAssetId.get(asset.id) ?? null,
      ),
    );
  }

  async findOneBySlug(slug: string, userId: number) {
    const baseCurrency = await this.getBaseCurrency(userId);
    const { asset, position } = await this.findAssetBySlug(slug, userId);

    return this.mapAssetResponse(asset, baseCurrency, position);
  }

  async create(dto: CreateAssetDto, userId: number) {
    const slug = await this.createUniqueSlug(dto.name, userId);
    const baseCurrency = await this.getBaseCurrency(userId);
    const currency = dto.currency ?? baseCurrency;

    try {
      const created = await this.prisma.asset.create({
        data: {
          userId,
          name: dto.name.trim(),
          slug,
          currency,
          assetIcon: {
            create: {
              name: dto.icon.name,
              backgroundColor: dto.icon.backgroundColor,
              color: dto.icon.color,
            },
          },
          portfolios: {
            create: {
              userId,
              quantity: new Prisma.Decimal(0),
              invested: new Prisma.Decimal(0),
            },
          },
        },
        include: {
          assetIcon: true,
          transactions: {
            where: { userId },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const position = await this.prisma.position.findUnique({
        where: {
          userId_assetId: { userId, assetId: created.id },
        },
      });

      return this.mapAssetResponse(created, baseCurrency, position);
    } catch (error: unknown) {
      if (this.isUniqueError(error)) {
        throw new ConflictException('Asset with this slug already exists');
      }
      throw error;
    }
  }

  async update(slug: string, dto: UpdateAssetDto, userId: number) {
    const baseCurrency = await this.getBaseCurrency(userId);
    const { asset: existing } = await this.findAssetBySlug(slug, userId);

    let nextSlug = existing.slug;
    if (dto.name && dto.name.trim() && dto.name.trim() !== existing.name) {
      nextSlug = await this.createUniqueSlug(dto.name, userId, existing.id);
    }

    const nextCurrency = dto.currency ?? existing.currency;

    const updated = await this.prisma.asset.update({
      where: { id: existing.id },
      data: {
        name: dto.name?.trim() || existing.name,
        slug: nextSlug,
        currency: nextCurrency,
        assetIcon: dto.icon
          ? {
              upsert: {
                create: {
                  name: dto.icon.name,
                  backgroundColor: dto.icon.backgroundColor,
                  color: dto.icon.color,
                },
                update: {
                  name: dto.icon.name,
                  backgroundColor: dto.icon.backgroundColor,
                  color: dto.icon.color,
                },
              },
            }
          : undefined,
      },
      include: {
        assetIcon: true,
        transactions: {
          where: { userId },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const position = await this.prisma.position.findUnique({
      where: {
        userId_assetId: { userId, assetId: updated.id },
      },
    });

    return this.mapAssetResponse(updated, baseCurrency, position);
  }

  async remove(slug: string, userId: number) {
    const { asset } = await this.findAssetBySlug(slug, userId);
    await this.prisma.asset.delete({ where: { id: asset.id } });
    return { ok: true as const };
  }

  async getTransactionsBySlug(
    slug: string,
    userId: number,
    period?: AssetPeriod,
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_slug: { userId, slug } },
      select: {
        id: true,
        currency: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const dateFrom = this.getDateFromPeriod(period ?? '6M');
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        assetId: asset.id,
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const unit = this.currencyToSymbol(asset.currency);
    const histories = transactions.map((tx) => ({
      id: String(tx.id),
      type: tx.type,
      date: tx.createdAt,
      price: Number(tx.price),
      count: Number(tx.quantity),
      unit,
    }));

    let runningValue = 0;
    const chart = transactions.map((tx) => {
      const amount = Number(tx.price) * Number(tx.quantity);
      runningValue += tx.type === TransactionType.buy ? amount : -amount;
      return {
        date: tx.createdAt.toISOString().slice(0, 10),
        value: Number(runningValue.toFixed(2)),
      };
    });

    return { histories, chart };
  }

  async createTransaction(
    slug: string,
    userId: number,
    dto: CreateAssetTransactionDto,
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_slug: { userId, slug } },
      select: {
        id: true,
        currency: true,
      },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const parsedPrice = Number(dto.price);
    const parsedCount = Number(dto.count);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      throw new BadRequestException('price must be > 0');
    }
    if (!Number.isFinite(parsedCount) || parsedCount <= 0) {
      throw new BadRequestException('count must be > 0');
    }

    const transaction = await this.prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          assetId: asset.id,
          type: dto.type,
          price: new Prisma.Decimal(parsedPrice),
          quantity: new Prisma.Decimal(parsedCount),
        },
      });

      const existingPosition = await tx.position.findUnique({
        where: {
          userId_assetId: {
            userId,
            assetId: asset.id,
          },
        },
      });

      const amount = parsedPrice * parsedCount;
      const signedQuantity = dto.type === 'buy' ? parsedCount : -parsedCount;
      const signedInvested = dto.type === 'buy' ? amount : -amount;

      const baseQuantity = existingPosition
        ? Number(existingPosition.quantity)
        : 0;
      const baseInvested = existingPosition
        ? Number(existingPosition.invested)
        : 0;
      const nextQuantity = Math.max(0, baseQuantity + signedQuantity);
      const nextInvested = Math.max(0, baseInvested + signedInvested);

      const positionData = {
        quantity: new Prisma.Decimal(nextQuantity),
        invested: new Prisma.Decimal(nextInvested),
      };

      if (!existingPosition) {
        await tx.position.create({
          data: {
            userId,
            assetId: asset.id,
            ...positionData,
          },
        });
      } else {
        await tx.position.update({
          where: { id: existingPosition.id },
          data: positionData,
        });
      }

      return created;
    });

    return {
      id: String(transaction.id),
      type: transaction.type,
      date: transaction.createdAt,
      price: Number(transaction.price),
      count: Number(transaction.quantity),
      unit: this.currencyToSymbol(asset.currency),
    };
  }

  private async findAssetBySlug(slug: string, userId: number) {
    const asset = await this.prisma.asset.findUnique({
      where: { userId_slug: { userId, slug } },
      include: {
        assetIcon: true,
        transactions: {
          where: { userId },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    const position = await this.prisma.position.findUnique({
      where: {
        userId_assetId: { userId, assetId: asset.id },
      },
    });
    return { asset, position };
  }

  private mapAssetResponse(
    asset: AssetWithRelations,
    baseCurrency: Currency,
    position: Position | null,
  ) {
    const quantity = position ? Number(position.quantity) : 0;
    const investedValue = position ? Number(position.invested) : 0;
    const profit = this.profitCalculator.calculate({
      to: { currency: asset.currency, value: quantity },
      from: { currency: baseCurrency, value: investedValue },
      baseCurrency,
    });

    return {
      id: String(asset.id),
      name: asset.name,
      slug: asset.slug,
      symbol: this.currencyToSymbol(asset.currency),
      price: Number(profit.currentValueInBase.toFixed(2)),
      profit: {
        amount: Number(profit.amount.toFixed(2)),
        percent: Number(profit.percent.toFixed(2)),
      },
      count: Number(quantity.toFixed(6)),
      icon: {
        name: asset.assetIcon?.name ?? 'banknote',
        backgroundColor: asset.assetIcon?.backgroundColor ?? '#DBEAFE',
        color: asset.assetIcon?.color ?? '#3B82F6',
      },
    };
  }

  private async getBaseCurrency(userId: number): Promise<Currency> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { baseCurrency: true },
    });
    return settings?.baseCurrency ?? Currency.usd;
  }

  private currencyToSymbol(currency: Currency) {
    if (currency === Currency.rub) return '₽';
    if (currency === Currency.usd) return '$';
    return 'г';
  }

  private getDateFromPeriod(period: AssetPeriod): Date | null {
    if (period === 'ALL') return null;

    const now = new Date();
    const date = new Date(now);
    if (period === '1Y') {
      date.setFullYear(now.getFullYear() - 1);
      return date;
    }

    const monthsMap: Record<Exclude<AssetPeriod, '1Y' | 'ALL'>, number> = {
      '1M': 1,
      '3M': 3,
      '6M': 6,
    };
    date.setMonth(now.getMonth() - monthsMap[period]);
    return date;
  }

  private async createUniqueSlug(
    rawName: string,
    userId: number,
    ignoreAssetId?: number,
  ) {
    const name = rawName.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let index = 1;

    while (true) {
      const existing = await this.prisma.asset.findUnique({
        where: { userId_slug: { userId, slug } },
        select: { id: true },
      });
      if (!existing || existing.id === ignoreAssetId) {
        return slug;
      }

      slug = `${baseSlug}-${index++}`;
    }
  }

  private isUniqueError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
