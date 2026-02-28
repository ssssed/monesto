import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
    });
  }

  async create(userId: string, body: { name: string; color?: string; alias: string }) {
    return this.prisma.tag.create({
      data: { userId, name: body.name, color: body.color ?? '#64748b', alias: body.alias },
    });
  }

  async update(userId: string, id: string, body: { name?: string; color?: string; alias?: string }) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    return this.prisma.tag.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.color != null && { color: body.color }),
        ...(body.alias != null && { alias: body.alias }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw new NotFoundException('Tag not found');
    await this.prisma.tag.delete({ where: { id } });
    return { ok: true };
  }
}
