export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

export interface MailService {
  sendVerificationCode(email: string, code: string): Promise<void>;
}
