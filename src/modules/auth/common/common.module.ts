import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { ICommonServiceToken } from './interfaces/common-service.interface';
import { OtpService } from './otp/otp.service';
import { IOtpRepositoryToken } from '../user-auth/interfaces/otp.repo.interface';
import { OtpRepository } from './repositories/otp.repo';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from './models/otp.schema';
import { IOtpServiceToken } from '../user-auth/interfaces/otp.service.interface';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from 'src/common/redis/redis.module';
import { IBaseRepositoryToken } from 'src/common/interfaces/base-repository.interface';
import { IUserServiceToken } from 'src/modules/users/interfaces/services/user.service.interface';
import { UsersService } from 'src/modules/users/services/users.service';
import { IUserRepositoryToken } from 'src/modules/users/interfaces/user.repo.interface';
import { UserRepository } from 'src/modules/users/repositories/user.repo';
import { BaseRepository } from 'src/common/repositories/base.repo';
import { User, userSchema } from 'src/modules/users/models/user.schema';

@Module({
    providers: [
        {
            provide: ICommonServiceToken,
            useClass: CommonService,
        },
        {
            provide: IOtpRepositoryToken,
            useClass: OtpRepository,
        },
        {
            provide: IOtpServiceToken,
            useClass: OtpService,
        },
        {
            provide:IUserServiceToken,
            useClass:UsersService
        },
        {
            provide:IUserRepositoryToken,
            useClass:UserRepository
        },
        // {
        //     provide:User,
        //     useClass:User
        // },
        {
            provide: IBaseRepositoryToken,
            useClass: BaseRepository,
        }
    ],
    imports: [
        MongooseModule.forFeature([
            { name: Otp.name, schema: OtpSchema },
            { name: User.name, schema: userSchema },
        ]),
        JwtModule.register({}),
        RedisModule
    ],
    controllers: [CommonController],
    exports: [ICommonServiceToken, IOtpServiceToken, IOtpRepositoryToken],
})
export class CommonModule {}
