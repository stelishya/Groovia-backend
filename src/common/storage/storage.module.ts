import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { IStorageServiceToken } from './interfaces/storage.interface';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        CloudinaryService,
        {
            provide: IStorageServiceToken,
            useClass: CloudinaryService
        }
    ],
    exports: [IStorageServiceToken]
})
export class StorageModule { }
