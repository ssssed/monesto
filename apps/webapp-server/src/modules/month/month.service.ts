import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { monthRecentData } from './mock';
import { UpdateMonthDto } from './dto/month.dto';

export type RecentInfo = {
  type: 'average' | 'last-incoming' | 'last-mandatory';
  amount: string;
  currency: string;
};

@Injectable()
export class MonthService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentMonthStatus({
    month,
    telegramId,
    year,
  }: {
    telegramId: string;
    year: number;
    month: number;
  }) {
    const monthData = await this.prisma.userMonth.findFirst({
      where: {
        user: {
          telegramId,
        },
        year,
        month,
      },
      select: {
        incomingAmount: true,
        incomingCurrency: true,
        mandatoryAmount: true,
        mandatoryCurrency: true,
        strategyName: true,
      },
    });

    if (!monthData) throw new BadRequestException('user not found');

    const incoming = new Prisma.Decimal(monthData!.incomingAmount ?? 0);
    const mandatory = new Prisma.Decimal(monthData!.mandatoryAmount ?? 0);

    const hasIncoming = !!monthData?.incomingAmount && incoming.toNumber() > 0;
    const hasMandatory =
      !!monthData?.mandatoryAmount && mandatory.toNumber() > 0;
    const hasStrategy =
      !!monthData?.strategyName && monthData.strategyName.length > 0;

    // Проверка валют
    if (
      monthData?.incomingCurrency &&
      monthData?.mandatoryCurrency &&
      monthData.incomingCurrency !== monthData.mandatoryCurrency
    ) {
      throw new BadRequestException(
        'Service does not support different currencies for income and mandatory expenses',
      );
    }

    const recentInfo = this.getRecentInfo({
      telegramId,
      year,
      month: month - 1,
    });

    return {
      hasIncoming,
      hasMandatory,
      isMonthComplete: hasIncoming && hasMandatory && hasStrategy,
      incoming: incoming.toString(),
      mandatory: mandatory.toString(),
      recentInfo,
    };
  }

  // TODO: убрать моки
  private getRecentInfo({
    month,
    telegramId,
    year,
  }: {
    telegramId: string;
    year: number;
    month: number;
  }) {
    if (!monthRecentData) throw new BadRequestException('user not found');

    const incoming = new Prisma.Decimal(monthRecentData!.incomingAmount ?? 0);
    const mandatory = new Prisma.Decimal(monthRecentData!.mandatoryAmount ?? 0);

    // Формируем recentInfo
    const recentInfo: Partial<
      Record<RecentInfo['type'], Omit<RecentInfo, 'type'>>
    > = {};

    if (incoming && incoming.toNumber() > 0) {
      recentInfo['last-incoming'] = {
        amount: incoming.toString(),
        currency: monthRecentData!.incomingCurrency ?? '$',
      };
    }

    if (mandatory && mandatory.toNumber() > 0) {
      recentInfo['last-mandatory'] = {
        amount: mandatory.toString(),
        currency: monthRecentData!.mandatoryCurrency ?? '$',
      };
    }

    // TODO: посчитать average
    // recentInfo.push({ type: 'average', amount: '0', currency: '$' });

    return recentInfo;
  }

  async updateMonth(params: {
    telegramId: string;
    year: number;
    month: number;
    dto: UpdateMonthDto;
  }) {
    const { telegramId, year, month, dto } = params;

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) throw new BadRequestException('User not found');

    // Существующий месяц
    const existingMonth = await this.prisma.userMonth.findUnique({
      where: {
        userId_year_month: {
          userId: user.id,
          year,
          month,
        },
      },
    });

    // Проверка валют
    const incomingCurrency =
      dto?.incomingCurrency !== undefined
        ? dto.incomingCurrency
        : (existingMonth?.incomingCurrency ?? 'USD');

    const mandatoryCurrency =
      dto?.mandatoryCurrency !== undefined
        ? dto.mandatoryCurrency
        : (existingMonth?.mandatoryCurrency ?? 'USD');

    if (
      incomingCurrency &&
      mandatoryCurrency &&
      incomingCurrency !== mandatoryCurrency
    ) {
      throw new BadRequestException(
        'Incoming and mandatory currencies must be the same. Mixed currencies are not supported.',
      );
    }

    await this.prisma.userMonth.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year,
          month,
        },
      },
      create: {
        userId: user.id,
        year,
        month,
        incomingAmount: dto?.incoming ? new Prisma.Decimal(dto.incoming) : null,
        incomingCurrency: incomingCurrency ?? '$',
        mandatoryAmount: dto?.mandatory
          ? new Prisma.Decimal(dto.mandatory)
          : null,
        mandatoryCurrency: mandatoryCurrency ?? '$',
        strategyName: dto?.strategy ?? null,
      },
      update: {
        ...(dto?.incoming !== undefined && {
          incomingAmount: new Prisma.Decimal(dto.incoming),
        }),
        ...(dto?.incomingCurrency && {
          incomingCurrency: dto.incomingCurrency,
        }),
        ...(dto?.mandatory !== undefined && {
          mandatoryAmount: new Prisma.Decimal(dto.mandatory),
        }),
        ...(dto?.mandatoryCurrency && {
          mandatoryCurrency: dto.mandatoryCurrency,
        }),
        ...(dto?.strategy && { strategyName: dto.strategy }),
      },
    });

    return {
      ok: true,
    };
  }
}
