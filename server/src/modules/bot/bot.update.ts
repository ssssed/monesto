import { Update, Start, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';

@Update()
export class BotUpdate {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    await this.userService.getOrCreateUser(telegramId);
    await ctx.replyWithPhoto(
      {
        url: 'https://img.freepik.com/free-photo/stock-market-exchange-economics-investment-graph_53876-167143.jpg?semt=ais_hybrid&w=740&q=80',
      },
      {
        caption: `👋 Привет!\n\nЯ помогу тебе лучше управлять своими финансами.`,
        reply_markup: Markup.inlineKeyboard([
          Markup.button.webApp(
            '🚀 Открыть приложение',
            this.configService.get('WEB_APP_URL') ?? 'https://localhost:5173',
          ),
        ]).reply_markup,
      },
    );
  }
}
