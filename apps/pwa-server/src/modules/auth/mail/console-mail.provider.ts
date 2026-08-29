import { Injectable, Logger } from '@nestjs/common';
import { MailService } from './mail.service';

/** Провайдер по умолчанию: печатает код в лог, реального письма не отправляет. */
@Injectable()
export class ConsoleMailProvider implements MailService {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  async sendVerificationCode(email: string, code: string): Promise<void> {
    this.logger.log(`Verification code for ${email}: ${code}`);
    await Promise.resolve();
  }
}
