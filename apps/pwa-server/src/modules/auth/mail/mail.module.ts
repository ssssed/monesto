import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsoleMailProvider } from './console-mail.provider';
import { MAIL_SERVICE } from './mail.service';
import { SmtpMailProvider } from './smtp-mail.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleMailProvider,
    SmtpMailProvider,
    {
      provide: MAIL_SERVICE,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleMailProvider,
        smtpProvider: SmtpMailProvider,
      ) => {
        return config.get<string>('MAIL_PROVIDER') === 'smtp'
          ? smtpProvider
          : consoleProvider;
      },
      inject: [ConfigService, ConsoleMailProvider, SmtpMailProvider],
    },
  ],
  exports: [MAIL_SERVICE],
})
export class MailModule {}
