import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Events } from './models/events.schema';
import { Model } from 'mongoose';
import { CreateRequestDto, updateBookingStatusDto } from './dto/client.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
export class ClientService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService,
        @InjectModel(Events.name) private readonly _eventModel: Model<Events>
    ) { }

    async getProfileByUserId(userId: string): Promise<User> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

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
        // const { location, sortBy, page, limit, danceStyle, search } = options;
         const { location, sortBy, danceStyle, search } = options;
 const page = parseInt(options.page as any, 10) || 1;
 const limit = parseInt(options.limit as any, 10) || 1;

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

    async getEventRequests(clientId: string, options: { page: number; limit: number; search?: string; status?: string; sortBy?: string; }): Promise<{ requests: Events[], total: number }> {
        const { page, limit, search, status, sortBy } = options;
        const query: any = { clientId };

        if (search) {
            // This is a simple search on the 'event' field. You might want to expand this.
            query.event = { $regex: search, $options: 'i' };
        }

        if (status) {
            query.status = status;
        }

        const sortOptions: any = {};
        if (sortBy === 'date') {
            sortOptions.date = -1; // Newest first
        } else {
            sortOptions.createdAt = -1; // Default sort
        }

        const requests = await this._eventModel
            .find(query)
            .populate('dancerId', 'username profileImage danceStyles')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const total = await this._eventModel.countDocuments(query);

        return { requests, total };
    }

    async updateEventRequestStatus(eventId: string, statusDto: updateBookingStatusDto): Promise<Events> {
        const event = await this._eventModel.findByIdAndUpdate(
            eventId,
            { status: statusDto.status },
            { new: true },
        );

        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        return event;
    }
}
