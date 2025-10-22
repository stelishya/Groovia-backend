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
    Inject
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
        return {
            message: 'Profile updated successfully',
            user: userDetails
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('event-requests')
    @HttpCode(HttpStatus.OK)
    async getEventRequests(@ActiveUser('userId') dancerId: string) {
        const requests = await this.dancerService.getEventRequests(dancerId);
        return { message: 'Event requests retrieved successfully', requests };
    }
}