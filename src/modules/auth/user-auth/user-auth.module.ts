import { Module } from '@nestjs/common';
import { UserAuthController } from './controllers/user-auth.controller';
import { IUserAuthServiceToken } from './interfaces/user-auth.service.interface';
import { UserAuthService } from './services/user-auth.service';
import { OtpService } from '../common/otp/otp.service';
import { UsersModule } from 'src/modules/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports:[UsersModule, MailModule, HashingModule, CommonModule],
    controllers:[UserAuthController],
    providers:[
        {
            provide:IUserAuthServiceToken,
            useClass:UserAuthService
        },
        OtpService
    ],
    exports:[IUserAuthServiceToken]
})
export class UserAuthModule {}
