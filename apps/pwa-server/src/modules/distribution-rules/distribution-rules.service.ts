import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDistributionRuleDto } from './dto/create-distribution-rule.dto';
import { UpdateDistributionRuleDto } from './dto/update-distribution-rule.dto';

@Injectable()
export class DistributionRulesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.distributionRule.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findOne(id: number, userId: number) {
    return this.findOwnedOrThrow(id, userId);
  }

  async create(dto: CreateDistributionRuleDto, userId: number) {
    await this.ensureTargetAssetOwnership(dto.targetAssetId, userId);
    return this.prisma.distributionRule.create({
      data: { userId, ...dto },
    });
  }

  async update(id: number, dto: UpdateDistributionRuleDto, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.ensureTargetAssetOwnership(dto.targetAssetId, userId);
    return this.prisma.distributionRule.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.prisma.distributionRule.delete({ where: { id } });
    return { ok: true as const };
  }

  private async ensureTargetAssetOwnership(
    targetAssetId: number | undefined,
    userId: number,
  ) {
    if (targetAssetId === undefined) return;
    const asset = await this.prisma.asset.findFirst({
      where: { id: targetAssetId, userId },
    });
    if (!asset) {
      throw new BadRequestException(
        'targetAssetId ссылается на несуществующий актив',
      );
    }
  }

  private async findOwnedOrThrow(id: number, userId: number) {
    const rule = await this.prisma.distributionRule.findFirst({
      where: { id, userId },
    });
    if (!rule) {
      throw new NotFoundException('Правило распределения не найдено');
    }
    return rule;
  }
}
