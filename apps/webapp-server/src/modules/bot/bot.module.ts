import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { UserService } from '../user/user.service';

@Module({
  providers: [BotUpdate, UserService],
})
export class BotModule {}
