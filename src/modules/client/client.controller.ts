import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { ClientService } from './client.service';

@Controller('client')
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
        // @Query('role') role?: string,
        // @Query('availableForPrograms') availableForPrograms?: boolean
    ) {
        const { dancers, total } = await this._clientService.getAllDancers({ location, sortBy, page, limit, danceStyle});
        return {message:'Dancers retrieved successfully', dancers, total, page, limit };
    }
}
