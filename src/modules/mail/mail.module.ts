import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { IMailServiceToken } from './interfaces/mail.interface';

@Module({
  providers: [{ provide: IMailServiceToken, useClass: MailService }],
  exports: [IMailServiceToken],
})
export class MailModule {}
