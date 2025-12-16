import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateRequestDto, updateBookingStatusDto, UpdateClientProfileDto } from '../dto/client.dto';
import { ClientService } from '../services/client.service';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwtAuth.guard';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/common-response.model';
import { HttpStatus } from 'src/common/enums/http-status.enum';

interface AuthRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: string[];
    };
}

@Controller('clients')
export class ClientController {
    constructor(
        private readonly _clientService: ClientService
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @HttpCode(HttpStatus.OK)
    async getProfile(@Req() req: AuthRequest) {
        // req.user contains { userId, email, role, ... }
        return this._clientService.getProfileByUserId(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('profile/upload-picture')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('profileImage', {
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only image files are allowed!'), false);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    async uploadProfilePicture(
        @ActiveUser('userId') userId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            const result = await this._clientService.uploadProfilePicture(userId, file);

            return ApiResponse.success({
                message: 'Profile picture uploaded successfully',
                user: result.user,
                imageUrl: result.imageUrl
            });
        } catch (error) {
            throw new BadRequestException('Failed to upload profile picture');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @ActiveUser('userId') userId: string,
        @Body() updateData: UpdateClientProfileDto,
    ) {
        const updatedUser = await this._clientService.updateClientProfile(userId, updateData);
        console.log("updatedUser", updatedUser)
        console.log("sending response to frontend")
        return ApiResponse.success({ message: MESSAGES.PROFILE_UPDATED_SUCCESSFULLY, user: updatedUser });
    }

    // IMPORTANT: Specific routes MUST come before generic routes in NestJS
    @UseGuards(JwtAuthGuard)
    @Get('dancer-profile/:id')
    @HttpCode(HttpStatus.OK)
    async getDancerProfile(
        @Param('id') dancerId: string,
    ) {
        const dancer = await this._clientService.getDancerProfile(dancerId);
        return ApiResponse.success({ message: MESSAGES.DANCER_PROFILE_RETRIEVED_SUCCESSFULLY, dancer });
    }

    // @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllDancers(
        @Query('location') location?: string,
        @Query('sortBy') sortBy?: string,
        @Query('page') page: any = 1,
        @Query('danceStyle') danceStyle?: string,
        @Query('search') search?: string,
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limit = 6;
        const { dancers, total } = await this._clientService.getAllDancers({ location, sortBy, page: pageNumber, limit, danceStyle, search });
        return ApiResponse.success({ message: MESSAGES.DANCERS_RETRIEVED_SUCCESSFULLY, dancers, total, page, limit });
    }


    @UseGuards(JwtAuthGuard)
    @Post('event-requests')
    @HttpCode(HttpStatus.CREATED)
    async createEventRequest(
        @Body() createRequestDto: CreateRequestDto,
        @ActiveUser('userId') clientId: string,
    ) {
        const newRequest = await this._clientService.createEventRequest(createRequestDto, clientId);
        // return { message: 'Request sent successfully', request: newRequest };
        return ApiResponse.success({ message: MESSAGES.REQUEST_SENT_SUCCESSFULLY, request: newRequest });
    }

    @UseGuards(JwtAuthGuard)
    @Get('event-requests')
    @HttpCode(HttpStatus.OK)
    async getEventRequests(
        @ActiveUser('userId') clientId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 6,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('sortBy') sortBy?: string,
    ) {
        const { requests, total } = await this._clientService.getEventRequests(clientId, { page, limit, search, status, sortBy });
        return ApiResponse.success({ message: MESSAGES.EVENT_REQUESTS_RETRIEVED_SUCCESSFULLY, requests, total, page, limit });
    }

    @UseGuards(JwtAuthGuard)
    @Patch('event-requests/:id/status')
    @HttpCode(HttpStatus.OK)
    async updateEventRequestStatus(
        @Param('id') eventId: string,
        @Body() statusDto: updateBookingStatusDto,
    ) {
        const updatedRequest = await this._clientService.updateEventRequestStatus(eventId, statusDto);
        return ApiResponse.success({ message: MESSAGES.BOOKING_STATUS_UPDATED_SUCCESSFULLY, request: updatedRequest });
    }
}