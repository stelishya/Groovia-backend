import { Inject, Injectable } from '@nestjs/common';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Events } from './models/events.schema';
import { Model } from 'mongoose';
import { CreateRequestDto } from './dto/create-request.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class ClientService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService,
        @InjectModel(Events.name) private readonly _eventModel: Model<Events>
    ) { }
    async getAllDancers(options: {
        location?: string;
        sortBy?: string;
        page: number;
        limit: number;
        danceStyle?: string,
        search?: string,
        // role?: string, 
        // availableForPrograms?: boolean
    }): Promise<{ dancers: User[], total: number }> {
        const { location, sortBy, page, limit, danceStyle, search } = options;

        const query: any = { role: 'dancer', availableForPrograms: true };
        if (location) {
            query.preferredLocation = { $regex: location, $options: 'i' };
        }
        if (danceStyle) {
            query.danceStyles = danceStyle;
        }
        if (search) {
            query.username = { $regex: search, $options: 'i' };
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

    async createEventRequest(createRequestDto: CreateRequestDto, clientId: string): Promise<Events> {
        const requestPayload = {
            ...createRequestDto,
            clientId,
        };
        const newRequest = new this._eventModel(requestPayload);
        return await newRequest.save();
    }

    async getEventRequests(clientId: string): Promise<Events[]> {
        return this._eventModel
            .find({ clientId })
            .populate('dancerId', 'username profileImage') // Populate dancer's username and profile image
            .sort({ createdAt: -1 })
            .exec();
    }
}
