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
        // {
        //     provide: IBaseRepositoryToken,
        //     useClass: IBaseRepository,
        // }
    ],
    imports: [
        MongooseModule.forFeature([
            { name: Otp.name, schema: OtpSchema },
        ]),
        JwtModule.register({}),
        RedisModule
    ],
    controllers: [CommonController],
    exports: [ICommonServiceToken, IOtpServiceToken, IOtpRepositoryToken],
})
export class CommonModule {}
