import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVacationPeriodDto } from './dto/create-vacation-period.dto';
import { UpdateVacationPeriodDto } from './dto/update-vacation-period.dto';

@Injectable()
export class VacationPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.vacationPeriod.findMany({
      where: { userId },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.findOwnedOrThrow(id, userId);
  }

  create(dto: CreateVacationPeriodDto, userId: number) {
    return this.prisma.vacationPeriod.create({
      data: {
        userId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: number, dto: UpdateVacationPeriodDto, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    return this.prisma.vacationPeriod.update({
      where: { id },
      data: {
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.prisma.vacationPeriod.delete({ where: { id } });
    return { ok: true as const };
  }

  private async findOwnedOrThrow(id: number, userId: number) {
    const period = await this.prisma.vacationPeriod.findFirst({
      where: { id, userId },
    });
    if (!period) {
      throw new NotFoundException('Период отпуска не найден');
    }
    return period;
  }
}
