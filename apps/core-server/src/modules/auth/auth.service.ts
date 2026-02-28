import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (existing) throw new UnauthorizedException('Login already taken');
    const passwordHash = bcrypt.hashSync(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { login: dto.login, passwordHash },
    });
    const token = this.jwtService.sign({ sub: user.id });
    return { access_token: token, user: { id: user.id, login: user.login } };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (!user) throw new UnauthorizedException('Invalid login or password');
    const ok = bcrypt.compareSync(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid login or password');
    const token = this.jwtService.sign({ sub: user.id });
    return { access_token: token, user: { id: user.id, login: user.login } };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
