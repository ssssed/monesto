import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIncomeSourceDto } from './dto/create-income-source.dto';
import { UpdateIncomeSourceDto } from './dto/update-income-source.dto';

@Injectable()
export class IncomeSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.incomeSource.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  findOne(id: number, userId: number) {
    return this.findOwnedOrThrow(id, userId);
  }

  create(dto: CreateIncomeSourceDto, userId: number) {
    return this.prisma.incomeSource.create({
      data: {
        userId,
        ...dto,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
        salaryTranches: (dto.salaryTranches ??
          undefined) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async update(id: number, dto: UpdateIncomeSourceDto, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    return this.prisma.incomeSource.update({
      where: { id },
      data: {
        ...dto,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
        salaryTranches: (dto.salaryTranches ??
          undefined) as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.prisma.incomeSource.delete({ where: { id } });
    return { ok: true as const };
  }

  private async findOwnedOrThrow(id: number, userId: number) {
    const incomeSource = await this.prisma.incomeSource.findFirst({
      where: { id, userId },
    });
    if (!incomeSource) {
      throw new NotFoundException('Источник дохода не найден');
    }
    return incomeSource;
  }
}
