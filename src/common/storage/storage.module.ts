import { Global, Module } from '@nestjs/common';
import { AwsS3Service } from './aws-s3.service';
import { IStorageServiceToken } from './interfaces/storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: IStorageServiceToken,
      useClass: AwsS3Service,
    },
  ],
  exports: [IStorageServiceToken],
})
export class StorageModule {}
