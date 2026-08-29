import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.expense.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  findOne(id: number, userId: number) {
    return this.findOwnedOrThrow(id, userId);
  }

  async create(dto: CreateExpenseDto, userId: number) {
    await this.ensureLinkedAssetOwnership(dto.linkedAssetId, userId);
    return this.prisma.expense.create({
      data: {
        userId,
        ...dto,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateExpenseDto, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.ensureLinkedAssetOwnership(dto.linkedAssetId, userId);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOwnedOrThrow(id, userId);
    await this.prisma.expense.delete({ where: { id } });
    return { ok: true as const };
  }

  private async ensureLinkedAssetOwnership(
    linkedAssetId: number | undefined,
    userId: number,
  ) {
    if (linkedAssetId === undefined) return;
    const asset = await this.prisma.asset.findFirst({
      where: { id: linkedAssetId, userId },
    });
    if (!asset) {
      throw new BadRequestException(
        'linkedAssetId ссылается на несуществующий актив',
      );
    }
  }

  private async findOwnedOrThrow(id: number, userId: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });
    if (!expense) {
      throw new NotFoundException('Расход не найден');
    }
    return expense;
  }
}
