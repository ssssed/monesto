import { ConfigService } from '@nestjs/config';
import { Ctx, Help, Start, Update } from 'nestjs-telegraf';
import type { Context } from 'telegraf';
import { Markup } from 'telegraf';

const START_MESSAGE =
  'Привет! Я бот Monesto — помогаю держать доход, выплаты и распределение по активам под контролем.\n' +
  'Напиши /help, если нужна справка по командам.';

@Update()
export class BotUpdate {
  constructor(private readonly config: ConfigService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    console.log('[bot/start] initData user:', JSON.stringify(ctx.from ?? null));
    const webApp = ctx.webAppData;
    if (webApp) {
      console.log('[bot/start] web_app_data:', webApp.data.text());
    }

    const webAppUrl = this.config.getOrThrow<string>('WEB_APP_URL');
    await ctx.reply(
      START_MESSAGE,
      Markup.inlineKeyboard([[Markup.button.webApp('Открыть приложение', webAppUrl)]])
    );
  }

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    await ctx.reply('Доступные команды: /start, /help');
  }
}
