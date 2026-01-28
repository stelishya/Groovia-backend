import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
  Inject,
} from '@nestjs/common';
import { VideoCallsService } from './video-calls.service';
// import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard'; // Assuming standard guard

import {
  type IVideoCallsService,
  IVideoCallsServiceToken,
} from './interfaces/video-calls.service.interface';
import { JwtAuthGuard } from '../auth/jwt/guards/jwtAuth.guard';

@Controller('video-calls')
@UseGuards(JwtAuthGuard)
export class VideoCallsController {
  constructor(
    @Inject(IVideoCallsServiceToken)
    private readonly videoCallsService: IVideoCallsService,
  ) {}

  @Post('workshop/:id/start')
  async startWorkshopSession(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.startSession(id, req.user.userId, 'workshop');
  }

  @Get('workshop/:id/token')
  async joinWorkshopSession(@Param('id') id: string, @Request() req) {
    return this.videoCallsService.joinSession(id, req.user.userId, 'workshop');
  }
}
