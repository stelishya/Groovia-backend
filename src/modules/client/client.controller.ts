import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateRequestDto, updateBookingStatusDto } from './dto/client.dto';
import { ClientService } from './client.service';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/commonResponse.model';
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
        private readonly _clientService: ClientService,
    ) { }

    @UseGuards(JwtAuthGuard)
@Get('profile')
@HttpCode(HttpStatus.OK)
async getProfile(@Req() req: AuthRequest) {
  // req.user contains { userId, email, role, ... }
  return this._clientService.getProfileByUserId(req.user.userId);
}
    // @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllDancers(
        @Query('location') location?: string,
        @Query('sortBy') sortBy?: string,
        @Query('page') page: any = 1,
        // @Query('limit') limit: number = 1,
        @Query('danceStyle') danceStyle?: string,
        @Query('search') search?: string,
        // @Query('role') role?: string,
        // @Query('availableForPrograms') availableForPrograms?: boolean
    ) {
         const pageNumber = parseInt(page, 10) || 1;
 const limit = 1; 
        const { dancers, total } = await this._clientService.getAllDancers({ location, sortBy, page:pageNumber, limit, danceStyle, search});
        // return {message:'Dancers retrieved successfully', dancers, total, page, limit };
        return ApiResponse.success({ message: MESSAGES.DANCERS_RETRIEVED_SUCCESSFULLY, dancers, total, page, limit });
        // return ApiResponse.success({ message: MESSAGES.DANCERS_RETRIEVED_SUCCESSFULLY, data: { dancers, total, page: pageNumber, limit } });
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
        @Query('limit') limit: number = 1,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('sortBy') sortBy?: string,
    ) {
        const { requests, total } = await this._clientService.getEventRequests(clientId, { page, limit, search, status, sortBy });
        // return { message: 'Event requests retrieved successfully', requests, total, page, limit };
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
        // return { message: 'Booking status updated successfully', request: updatedRequest };
        return ApiResponse.success({ message: MESSAGES.BOOKING_STATUS_UPDATED_SUCCESSFULLY, request: updatedRequest });
    }
}