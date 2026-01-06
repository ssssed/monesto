import { Update, Start, Ctx } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Update()
export class BotUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.replyWithPhoto(
      {
        url: 'https://img.freepik.com/free-photo/stock-market-exchange-economics-investment-graph_53876-167143.jpg?semt=ais_hybrid&w=740&q=80',
      },
      {
        caption: `👋 Привет!\n\nЯ помогу тебе лучше управлять своими финансами.`,
        reply_markup: Markup.inlineKeyboard([
          Markup.button.webApp(
            '🚀 Открыть приложение',
            'https://github.com/ssssed',
          ),
        ]).reply_markup,
      },
    );
  }
}
