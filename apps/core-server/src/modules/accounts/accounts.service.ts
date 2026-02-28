import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      include: { tags: true },
    });
  }

  async findOne(userId: string, id: string) {
    const acc = await this.prisma.account.findFirst({
      where: { id, userId },
      include: { tags: true },
    });
    if (!acc) throw new NotFoundException('Account not found');
    return acc;
  }

  async create(
    userId: string,
    body: { name: string; type: 'account' | 'asset'; currency: string; tagIds?: string[] },
  ) {
    return this.prisma.account.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        currency: body.currency,
        ...(body.tagIds?.length
          ? { tags: { connect: body.tagIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { tags: true },
    });
  }

  async update(
    userId: string,
    id: string,
    body: { name?: string; type?: 'account' | 'asset'; currency?: string; tagIds?: string[] },
  ) {
    await this.findOne(userId, id);
    return this.prisma.account.update({
      where: { id },
      data: {
        ...(body.name != null && { name: body.name }),
        ...(body.type != null && { type: body.type }),
        ...(body.currency != null && { currency: body.currency }),
        ...(body.tagIds && { tags: { set: body.tagIds.map((tagId) => ({ id: tagId })) } }),
      },
      include: { tags: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.account.delete({ where: { id } });
    return { ok: true };
  }
}
