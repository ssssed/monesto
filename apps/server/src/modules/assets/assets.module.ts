import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [UserModule],
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
