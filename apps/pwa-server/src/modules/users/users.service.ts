import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async updateSettings(userId: number, dto: UpdateUserSettingsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
