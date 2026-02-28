import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRuleDto, UpdateRuleDto } from './dto/rules.dto';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.rule.findMany({
      where: { userId },
      include: { steps: { orderBy: { order: 'asc' } }, incomeType: true },
    });
  }

  async findOne(userId: string, id: string) {
    const rule = await this.prisma.rule.findFirst({
      where: { id, userId },
      include: { steps: { orderBy: { order: 'asc' } }, incomeType: true },
    });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async create(userId: string, dto: CreateRuleDto) {
    const rule = await this.prisma.rule.create({
      data: {
        userId,
        triggerIncomeTypeId: dto.triggerIncomeTypeId,
        showOnDashboard: dto.showOnDashboard ?? false,
        order: dto.order ?? 0,
      },
    });
    for (const step of dto.steps) {
      const params = step.params as Record<string, unknown>;
      await this.prisma.ruleStep.create({
        data: {
          ruleId: rule.id,
          order: step.order,
          actionType: step.actionType,
          params: params as object,
          targetAccountId: (step.actionType === 'transfer' || step.actionType === 'convert_and_transfer')
            ? (params.targetAccountId as string)
            : undefined,
        },
      });
    }
    return this.findOne(userId, rule.id);
  }

  async update(userId: string, id: string, dto: UpdateRuleDto) {
    await this.findOne(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.rule.update({
        where: { id },
        data: {
          ...(dto.triggerIncomeTypeId != null && { triggerIncomeTypeId: dto.triggerIncomeTypeId }),
          ...(dto.showOnDashboard != null && { showOnDashboard: dto.showOnDashboard }),
          ...(dto.order != null && { order: dto.order }),
        },
      });
      if (dto.steps != null) {
        await tx.ruleStep.deleteMany({ where: { ruleId: id } });
        const rule = await tx.rule.findUnique({ where: { id } });
        if (rule) {
          for (const step of dto.steps) {
            const params = step.params as Record<string, unknown>;
            await tx.ruleStep.create({
              data: {
                ruleId: id,
                order: step.order,
                actionType: step.actionType,
                params: step.params as object,
                targetAccountId: (step.actionType === 'transfer' || step.actionType === 'convert_and_transfer')
                  ? (params.targetAccountId as string)
                  : undefined,
              },
            });
          }
        }
      }
    });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.rule.delete({ where: { id } });
    return { ok: true };
  }
}
