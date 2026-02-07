import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  HttpCode,
  // HttpStatus,
  UseGuards,
  Inject,
  Query,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UpdateDancerProfileDto, CreateReviewDto } from './dto/dancer.dto';
import { DancerService } from './dancer.service';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import {
  IUserServiceToken,
  type IUserService,
} from '../users/interfaces/user.service.interface';
import { JwtAuthGuard } from '../auth/jwt/guards/jwtAuth.guard';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/common-response.model';
import { HttpStatus } from 'src/common/enums/http-status.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  type IDancerService,
  type AuthRequest,
  IDancerServiceToken,
} from './interfaces/dancer.interface';

@Controller('dancers')
export class DancerController {
  constructor(
    @Inject(IDancerServiceToken)
    private readonly dancerService: IDancerService,
    @Inject(IUserServiceToken)
    private readonly userService: IUserService,
  ) {
    console.log('DancerController initialized');
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: AuthRequest) {
    // req.user contains { userId, email, role, ... }
    return this.dancerService.getProfileByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/upload-picture')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed!'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfilePicture(
    @Req() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.dancerService.uploadProfilePicture(
        req.user.userId,
        file,
      );

      return ApiResponse.success({
        message: 'Profile picture uploaded successfully',
        user: result.user,
        imageUrl: result.imageUrl,
      });
    } catch (error) {
      throw new BadRequestException('Failed to upload profile picture');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile/upload-certificate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('certificate', {
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(pdf|jpg|jpeg|png)$/)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only PDF and image files are allowed!'),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadCertificate(
    @Req() req: AuthRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body('name') certificateName?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const certificate = await this.dancerService.uploadCertificate(
        req.user.userId,
        file,
        certificateName,
      );

      return ApiResponse.success({
        message: 'Certificate uploaded successfully',
        certificate,
      });
    } catch (error) {
      console.error('Certificate upload error:', error);
      throw new BadRequestException('Failed to upload certificate');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateData: UpdateDancerProfileDto,
  ) {
    console.log('updateProfile in dancer.controller.ts: ', req);
    const userDetails = await this.dancerService.updateProfile(
      req.user.userId,
      updateData,
    );
    return ApiResponse.success({
      message: MESSAGES.PROFILE_UPDATED_SUCCESSFULLY,
      user: userDetails,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('event-requests')
  @HttpCode(HttpStatus.OK)
  async getEventRequests(
    @ActiveUser('userId') dancerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const { requests, total } = await this.dancerService.getEventRequests(
      dancerId,
      { page, limit, search, status, sortBy },
    );
    // return { message: 'Event requests retrieved successfully', requests, total, page, limit };
    return ApiResponse.success({
      message: MESSAGES.EVENT_REQUESTS_RETRIEVED_SUCCESSFULLY,
      requests,
      total,
      page,
      limit,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':dancerId/like')
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('dancerId') dancerId: string,
    @ActiveUser('userId') userId: string,
  ) {
    const updatedDancer = await this.dancerService.toggleLike(dancerId, userId);
    // return { message: 'Like status updated successfully', dancer: updatedDancer };
    return ApiResponse.success({
      message: MESSAGES.LIKE_STATUS_UPDATED_SUCCESSFULLY,
      dancer: updatedDancer,
    });
  }
}
