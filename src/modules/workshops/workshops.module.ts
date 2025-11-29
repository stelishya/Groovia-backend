import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../../common/storage/storage.module';
import { Workshop, WorkshopSchema } from './models/workshop.schema';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Workshop.name, schema: WorkshopSchema }]),
        StorageModule,
    ],
    controllers: [WorkshopsController],
    providers: [WorkshopsService],
    exports: [WorkshopsService],
})
export class WorkshopsModule { }
