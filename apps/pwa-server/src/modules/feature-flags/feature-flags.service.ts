import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Публичная карта `key -> enabled`, без метаданных. */
  async getPublicMap(): Promise<Record<string, boolean>> {
    const flags = await this.prisma.featureFlag.findMany({
      select: { key: true, enabled: true },
    });
    return Object.fromEntries(flags.map((f) => [f.key, f.enabled]));
  }

  async findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async create(dto: CreateFeatureFlagDto, adminId: number) {
    try {
      return await this.prisma.featureFlag.create({
        data: {
          key: dto.key,
          enabled: dto.enabled ?? false,
          description: dto.description,
          updatedBy: adminId,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Флаг "${dto.key}" уже существует`);
      }
      throw error;
    }
  }

  async update(key: string, dto: UpdateFeatureFlagDto, adminId: number) {
    await this.ensureExists(key);
    return this.prisma.featureFlag.update({
      where: { key },
      data: { ...dto, updatedBy: adminId },
    });
  }

  async remove(key: string) {
    await this.ensureExists(key);
    await this.prisma.featureFlag.delete({ where: { key } });
    return { ok: true as const };
  }

  private async ensureExists(key: string) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      throw new NotFoundException(`Флаг "${key}" не найден`);
    }
  }
}
