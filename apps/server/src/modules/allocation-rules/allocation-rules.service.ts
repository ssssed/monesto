import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AllocationTopUpType,
  Prisma,
  type AllocationRule,
  type Asset,
  type AssetIcon,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetService } from '../asset/asset.service';
import { CreateAllocationRuleDto } from './dto/create-allocation-rule.dto';

type AllocationRuleWithAsset = AllocationRule & {
  asset: Asset & { assetIcon: AssetIcon | null };
};

@Injectable()
export class AllocationRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetService: AssetService,
  ) {}

  async findAll(userId: number) {
    const rules = await this.prisma.allocationRule.findMany({
      where: { userId },
      include: {
        asset: {
          include: {
            assetIcon: true,
          },
        },
      },
      orderBy: [{ executionDate: 'asc' }, { id: 'asc' }],
    });

    return rules.map((rule) => this.mapRuleResponse(rule));
  }

  async create(userId: number, dto: CreateAllocationRuleDto) {
    this.assertValidValue(dto.topUpType, dto.value);

    const asset = await this.prisma.asset.findUnique({
      where: {
        userId_slug: {
          userId,
          slug: dto.assetSlug.trim(),
        },
      },
      include: {
        assetIcon: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const executionDate = this.parseExecutionDate(dto.executionDate);

    const created = await this.prisma.allocationRule.create({
      data: {
        userId,
        assetId: asset.id,
        topUpType: dto.topUpType,
        value: new Prisma.Decimal(dto.value),
        executionDate,
      },
      include: {
        asset: {
          include: {
            assetIcon: true,
          },
        },
      },
    });

    return this.mapRuleResponse(created);
  }

  async remove(userId: number, ruleId: number) {
    const existing = await this.prisma.allocationRule.findFirst({
      where: { id: ruleId, userId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Allocation rule not found');
    }

    await this.prisma.allocationRule.delete({
      where: { id: existing.id },
    });

    return { ok: true as const };
  }

  private assertValidValue(topUpType: AllocationTopUpType, value: number) {
    if (!Number.isFinite(value)) {
      throw new BadRequestException('value must be a finite number');
    }

    if (topUpType === AllocationTopUpType.percent) {
      if (value <= 0 || value > 100) {
        throw new BadRequestException(
          'Для типа percent значение должно быть в диапазоне (0, 100]',
        );
      }
      return;
    }

    if (value <= 0) {
      throw new BadRequestException(
        'Для типов fixed_amount и quantity значение должно быть положительным',
      );
    }
  }

  private parseExecutionDate(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('executionDate must be a valid date');
    }
    return date;
  }

  private mapRuleResponse(rule: AllocationRuleWithAsset) {
    return {
      id: String(rule.id),
      asset: {
        name: rule.asset.name,
        currency: rule.asset.currency,
        symbol: this.assetService.getCurrencySymbol(rule.asset.currency),
        icon: {
          name: rule.asset.assetIcon?.name ?? 'banknote',
          backgroundColor: rule.asset.assetIcon?.backgroundColor ?? '#DBEAFE',
          color: rule.asset.assetIcon?.color ?? '#3B82F6',
        },
      },
      executionDate: rule.executionDate.toISOString().slice(0, 10),
      topUpType: rule.topUpType,
      value: Number(rule.value),
    };
  }
}
