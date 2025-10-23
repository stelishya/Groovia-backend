import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateRequestDto, updateBookingStatusDto } from './dto/client.dto';
import { ClientService } from './client.service';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';

@Controller('clients')
export class ClientController {
    constructor(
        private readonly _clientService: ClientService,
    ) { }
    // @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async getAllDancers(
        @Query('location') location?: string,
        @Query('sortBy') sortBy?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('danceStyle') danceStyle?: string,
        @Query('search') search?: string,
        // @Query('role') role?: string,
        // @Query('availableForPrograms') availableForPrograms?: boolean
    ) {
        const { dancers, total } = await this._clientService.getAllDancers({ location, sortBy, page, limit, danceStyle, search});
        return {message:'Dancers retrieved successfully', dancers, total, page, limit };
    }

    @UseGuards(JwtAuthGuard)
    @Post('event-requests')
    @HttpCode(HttpStatus.CREATED)
    async createEventRequest(
        @Body() createRequestDto: CreateRequestDto,
        @ActiveUser('userId') clientId: string,
    ) {
        const newRequest = await this._clientService.createEventRequest(createRequestDto, clientId);
        return { message: 'Request sent successfully', request: newRequest };
    }

    @UseGuards(JwtAuthGuard)
    @Get('event-requests')
    @HttpCode(HttpStatus.OK)
    async getEventRequests(
        @ActiveUser('userId') clientId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('sortBy') sortBy?: string,
    ) {
        const { requests, total } = await this._clientService.getEventRequests(clientId, { page, limit, search, status, sortBy });
        return { message: 'Event requests retrieved successfully', requests, total, page, limit };
    }

    @UseGuards(JwtAuthGuard)
    @Patch('event-requests/:id/status')
    @HttpCode(HttpStatus.OK)
    async updateEventRequestStatus(
        @Param('id') eventId: string,
        @Body() statusDto: updateBookingStatusDto,
    ) {
        const updatedRequest = await this._clientService.updateEventRequestStatus(eventId, statusDto);
        return { message: 'Booking status updated successfully', request: updatedRequest };
    }
}