import { Module } from '@nestjs/common';
import { UserAuthController } from './controllers/user-auth.controller';
import { IUserAuthServiceToken } from './interfaces/user-auth.service.interface';
import { UserAuthService } from './services/user-auth.service';
import { OtpService } from '../common/otp/otp.service';
import { UsersModule } from 'src/modules/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { CommonModule } from '../common/common.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from '../services/token.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../strategies/jwtRefresh.strategy';

@Module({
    imports:[
        UsersModule, 
        MailModule, 
        HashingModule, 
        CommonModule,
        PassportModule,    
        JwtModule.register({}),
    ],
    controllers:[UserAuthController],
    providers:[
        {
            provide:IUserAuthServiceToken,
            useClass:UserAuthService
        },
        OtpService,
        TokenService,
        JwtStrategy,
        JwtRefreshStrategy
    ],
    exports:[IUserAuthServiceToken,TokenService]
})
export class UserAuthModule {}
