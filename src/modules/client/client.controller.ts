import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateRequestDto } from './dto/create-request.dto';
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
    async getEventRequests(@ActiveUser('userId') clientId: string) {
        const requests = await this._clientService.getEventRequests(clientId);
        return { message: 'Event requests retrieved successfully', requests };
    }
}