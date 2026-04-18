import { Module } from '@nestjs/common';
import { AssetsModule } from './modules/assets/assets.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, UserModule, AssetsModule],
})
export class AppModule {}
