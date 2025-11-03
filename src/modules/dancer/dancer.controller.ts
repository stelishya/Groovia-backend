import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    Param,
    Req,
    HttpCode,
    HttpStatus,
    UseGuards,
    Inject,
    Query
} from '@nestjs/common';
import { Request } from 'express';
import { Types } from 'mongoose';
import { UpdateDancerProfileDto, CreateReviewDto } from './dto/dancer.dto';
import { DancerService } from './dancer.service';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { IUserServiceToken, type IUserService } from '../users/interfaces/services/user.service.interface';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/commonResponse.model';


interface AuthRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string[];
    };
}
@Controller('dancers')
export class DancerController {
    constructor(
        private readonly dancerService: DancerService,
        @Inject(IUserServiceToken)
        private readonly userService: IUserService
    ) { 

        console.log("DancerController initialized");
    }

    @UseGuards(JwtAuthGuard)
@Get('profile')
@HttpCode(HttpStatus.OK)
async getProfile(@Req() req: AuthRequest) {
  // req.user contains { userId, email, role, ... }
  return this.dancerService.getProfileByUserId(req.user.userId);
}

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @Req() req: AuthRequest,
        @Body() updateData: UpdateDancerProfileDto
    ) {
        console.log("updateProfile in dancer.controller.ts: ",req)
        const userId = new Types.ObjectId(req.user.userId);
        console.log("userId in dancer.controller.ts",userId)
        // const updatedUser = await this.userService.updateOne(
        //     { _id: userId },
        //     { $set: updateData }
        // );
        // if (!updatedUser) {
        //     throw new Error('Failed to update profile'); 
        // }
        
        // const { password, ...userDetails } = updatedUser.toObject();
         const userDetails = await this.dancerService.updateProfile(userId, updateData);
        return ApiResponse.success({ message: MESSAGES.PROFILE_UPDATED_SUCCESSFULLY, user: userDetails });
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
        const { requests, total } = await this.dancerService.getEventRequests(dancerId, { page, limit, search, status, sortBy });
        // return { message: 'Event requests retrieved successfully', requests, total, page, limit };
        return ApiResponse.success({ message: MESSAGES.EVENT_REQUESTS_RETRIEVED_SUCCESSFULLY, requests, total, page, limit });
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
        return ApiResponse.success({ message: MESSAGES.LIKE_STATUS_UPDATED_SUCCESSFULLY, dancer: updatedDancer });
    }
}