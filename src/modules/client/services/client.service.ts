import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { type IUserService, IUserServiceToken } from '../../users/interfaces/services/user.service.interface';
import { User } from '../../users/models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Events } from '../models/events.schema';
import { Model, Types } from 'mongoose';
import { CreateRequestDto, updateBookingStatusDto, UpdateClientProfileDto } from '../dto/client.dto';
import { NotificationType } from '../../notifications/models/notification.schema';
import { NotificationService } from '../../notifications/services/notification.service';
import { UsersService } from '../../users/services/users.service';
// import { UserService } from '../users/services/user.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface LeanEvent extends Omit<Events, '_id' | 'clientId' | 'dancerId'> {
    _id: Types.ObjectId;
    clientId: Types.ObjectId;
    dancerId: Types.ObjectId;
    [key: string]: any; // For other dynamic properties
}


interface PopulatedEvent extends Omit<Events, 'clientId' | 'dancerId'> {
    _id: Types.ObjectId;
    clientId: User & { _id: Types.ObjectId };
    dancerId: User & { _id: Types.ObjectId };
    [key: string]: any; // For other dynamic properties
}
type SavedEvent = Events & { _id: Types.ObjectId };

@Injectable()
export class ClientService {
    constructor(
        @InjectModel(Events.name) private readonly _eventModel: Model<Events>,
        @Inject(forwardRef(() => UsersService))
        private readonly userService: UsersService,
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
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
            sortOptions.likes = -1; // descending order (most likes first)
        } else if (sortBy === 'name') {
            sortOptions.username = 1; // ascending order (A-Z)
        }
        const dancers = await this.userService.find(query, {
            sort: sortOptions,
            skip: (page - 1) * limit,
            limit: limit
        });
        const total = await this.userService.count(query);
        return { dancers, total };
    }

    async getDancerProfile(dancerId: string): Promise<User> {
        const dancer = await this.userService.findById(dancerId);
        if (!dancer) {
            throw new NotFoundException('Dancer not found');
        }
        return dancer;
    }

    async createEventRequest(createRequestDto: CreateRequestDto, clientId: string): Promise<Events> {
        const requestPayload = {
            ...createRequestDto,
            clientId: new Types.ObjectId(clientId),
        };
        const newRequest = new this._eventModel(requestPayload);
        const savedRequest = await newRequest.save() as unknown as SavedEvent;

        // Get client details for notification
        const client = await this.userService.findById(clientId);
        if (!client) {
            throw new NotFoundException('Client not found');
        }

        // Create notification for dancer
        await this.notificationService.createNotification(
            new Types.ObjectId(createRequestDto.dancerId),
            NotificationType.EVENT_REQUEST_RECEIVED,
            'New Event Request',
            `You have a new event request from ${client.username}`,
            undefined,
            {
                eventId: savedRequest._id.toString(),
                clientId: client._id.toString(),
                clientName: client.username || 'A client',
                eventType: createRequestDto.event,
                // eventDate: createRequestDto.date instanceof Date ? createRequestDto.date : new Date(createRequestDto.date),
                eventDate: createRequestDto.date
                    ? new Date(createRequestDto.date)
                    : new Date(),
                venue: createRequestDto.venue
            }
        );

        return savedRequest;
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
        const event = await this._eventModel.findById(eventId)
            .populate<{ clientId: User, dancerId: User }>([
                { path: 'clientId', select: 'username' },
                { path: 'dancerId', select: 'username' }
            ])
            // .populate('dancerId', 'username')
            .lean()
            .exec() as unknown as PopulatedEvent;

        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }

        // Update the event status
        // event.status = statusDto.status;
        // const updatedEvent = await event.save();

        const updatedEvent = await this._eventModel.findByIdAndUpdate(
            eventId,
            { status: statusDto.status },
            { new: true, lean: true }
        ).exec() as unknown as LeanEvent;

        if (!updatedEvent) {
            throw new NotFoundException(`Failed to update event ${eventId}`);
        }

        // Type guard to check if the document is populated
        const isPopulated = (obj: any): obj is { clientId: User, dancerId: User } => {
            return obj &&
                obj.clientId &&
                obj.dancerId &&
                typeof obj.clientId === 'object' &&
                typeof obj.dancerId === 'object';
        };

        if (!isPopulated(event)) {
            throw new Error('Failed to populate event with user data');
        }

        // Determine notification type and message based on status
        let notificationType: NotificationType;
        let title: string;
        let message: string;
        let recipientId: string;
        // const senderName = event.clientId['_id'].toString() === event.clientId._id.toString() 
        //     ? event.clientId['username'] 
        //     : 'A client';
        const senderName = event.clientId.username || 'A client';


        switch (statusDto.status) {
            case 'accepted':
                notificationType = NotificationType.EVENT_REQUEST_ACCEPTED;
                title = 'Event Request Accepted';
                message = `Your event request has been accepted by ${event.dancerId['username']}`;
                recipientId = event.clientId._id.toString();
                break;
            case 'rejected':
                notificationType = NotificationType.EVENT_REQUEST_REJECTED;
                title = 'Event Request Declined';
                message = `Your event request has been declined by ${event.dancerId['username']}`;
                recipientId = event.clientId._id.toString();
                break;
            case 'cancelled':
                notificationType = NotificationType.EVENT_REQUEST_CANCELLED;
                title = 'Event Cancelled';
                message = `${senderName} has cancelled the event request`;
                recipientId = event.dancerId._id.toString();
                break;
            default:
                return updatedEvent as unknown as Events;
        }

        // Create and send notification
        await this.notificationService.createNotification(
            new Types.ObjectId(recipientId),
            notificationType,
            title,
            message,
            undefined,
            {
                eventId: updatedEvent._id.toString(),
                eventType: updatedEvent.event,
                eventDate: updatedEvent.date instanceof Date ? updatedEvent.date : new Date(updatedEvent.date),
                venue: updatedEvent.venue,
                status: statusDto.status
            }
        );

        return updatedEvent as unknown as Events;
    }

    async updateClientProfile(userId: string, updateData: UpdateClientProfileDto): Promise<User> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if username is being changed and if it's already taken
        if (updateData.username && updateData.username !== user.username) {
            const existingUser = await this.userService.findByUsername(updateData.username);
            if (existingUser) {
                throw new NotFoundException('Username already taken');
            }
        }

        // Check if email is being changed and if it's already taken
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await this.userService.findByEmail(updateData.email);
            if (existingUser) {
                throw new NotFoundException('Email already in use');
            }
        }

        // Update only provided fields
        const updatedUser = await this.userService.updateOne(
            { _id: user._id },
            { $set: updateData }
        );

        if (!updatedUser) {
            throw new NotFoundException('Failed to update profile');
        }

        console.log('Updated user in service:', updatedUser);

        // Remove password from response
        const userObject = (updatedUser as any).toJSON ? (updatedUser as any).toJSON() : updatedUser;
        const { password, ...userWithoutPassword } = userObject as any;

        return userWithoutPassword as User;
    }
}
