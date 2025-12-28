import { Module } from '@nestjs/common';
import { VideoCallsGateway } from './video-calls.gateway';
import { VideoCallsService } from './video-calls.service';
import { VideoCallsController } from './video-calls.controller';
import { WorkshopsModule } from '../workshops/workshops.module';
import { CompetitionModule } from '../competitions/competition.module';
import { IVideoCallsServiceToken } from './interfaces/video-calls.service.interface';

@Module({
  imports: [WorkshopsModule, CompetitionModule],
  providers: [
    VideoCallsGateway,
    {
      provide: IVideoCallsServiceToken,
      useClass: VideoCallsService
    }
  ],
  controllers: [VideoCallsController],
  exports: [IVideoCallsServiceToken],
})
export class VideoCallsModule { }
