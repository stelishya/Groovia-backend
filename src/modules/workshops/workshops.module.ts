import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../../common/storage/storage.module';
import { Workshop, WorkshopSchema } from './models/workshop.schema';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';
import { WorkshopsRepository } from './repositories/workshops.repo';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Workshop.name, schema: WorkshopSchema }]),
        StorageModule,
    ],
    controllers: [WorkshopsController],
    providers: [WorkshopsService, WorkshopsRepository],
    exports: [WorkshopsService],
})
export class WorkshopsModule { }
