import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMonthDto } from './dto/month.dto';

@Injectable()
export class MonthService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentMonthStatus(telegramId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthData = await this.prisma.userMonth.findFirst({
      where: {
        user: {
          telegramId,
        },
        year,
        month,
      },
      select: {
        incoming: true,
        mandatory: true,
      },
    });

    const hasIncoming = !!monthData?.incoming && monthData.incoming > 0;

    const hasMandatory = !!monthData?.mandatory && monthData.mandatory > 0;

    return {
      hasIncoming,
      hasMandatory,
      isMonthComplete: hasIncoming && hasMandatory,
    };
  }

  async updateMonth(params: {
    telegramId: string;
    year: number;
    month: number;
    dto: UpdateMonthDto;
  }) {
    const { telegramId, year, month, dto } = params;

    this.assertMonthEditable(year, month);

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const monthRecord = await this.prisma.userMonth.upsert({
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
        incoming: dto.incoming ?? null,
        mandatory: dto.mandatory ?? null,
      },
      update: {
        ...(dto.incoming !== undefined && {
          incoming: dto.incoming,
        }),
        ...(dto.mandatory !== undefined && {
          mandatory: dto.mandatory,
        }),
        ...(dto.strategy !== undefined && {
          strategy: dto.strategy,
        }),
      },
    });

    return {
      success: true,
      month: monthRecord,
    };
  }

  /**
   * 🔒 Блокировка прошлых месяцев
   */
  private assertMonthEditable(year: number, month: number) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const isPast =
      year < currentYear || (year === currentYear && month < currentMonth);

    if (isPast) {
      throw new ForbiddenException('Past months are read-only');
    }
  }
}
