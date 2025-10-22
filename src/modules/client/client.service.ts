import { Inject, Injectable } from '@nestjs/common';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class ClientService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService
    ) { }
    async getAllDancers(options: { 
        location?: string; 
        sortBy?: string; 
        page: number; 
        limit: number; 
        danceStyle?: string, 
        // role?: string, 
        // availableForPrograms?: boolean
    }) : Promise<{dancers:User[],total:number}>{
        const { location, sortBy, page, limit,danceStyle } = options;

        const query: any = { role: 'dancer' ,availableForPrograms:true};
        if (location) {
            query.preferredLocation = { $regex: location, $options: 'i' };
        }
        if (danceStyle) {
            query.danceStyles = danceStyle;
        }
        const sortOptions: any = {};
        if (sortBy === 'likes') {
            sortOptions.likes = -1; // descending order
        }
        const dancers = await this.userService.find(query, {
            sort: sortOptions,
            skip: (page - 1) * limit,
            limit: limit
        });
        const total = await this.userService.count(query);
        return { dancers, total };
    }
}
