import { ConsoleLogger, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UpdateDancerProfileDto } from './dto/dancer.dto';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Events } from '../client/models/events.schema';

@Injectable()
export class DancerService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService,
        @InjectModel(Events.name) private readonly _eventModel: Model<Events>
    ) { }

    async updateProfile(userId: Types.ObjectId, updateData: UpdateDancerProfileDto) {
        console.log("updateProfile in dancer.service.ts")
        // Update user in database
        const updatedUser = await this.userService.updateOne(
            { _id: userId },
            { $set: updateData }
        );
        if (!updatedUser) {
            throw new Error('Failed to update profile');
        }
        // Convert to plain object and remove sensitive data
        const userObject = (updatedUser as any).toJSON ? (updatedUser as any).toJSON() : updatedUser;
        const { password, ...userDetails } = userObject as any;
        console.log("userDetails in dancer.service.ts",userDetails)
        return userDetails;
    }

    async getEventRequests(dancerId: string, options: { page: number; limit: number; search?: string; status?: string; sortBy?: string; }): Promise<{ requests: Events[], total: number }> {
        const { page, limit, search, status, sortBy } = options;
        const query: any = { dancerId };

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
            .populate('clientId', 'username profileImage')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const total = await this._eventModel.countDocuments(query);

        return { requests, total };
    }

    async toggleLike(dancerId: string, userId: string): Promise<User> {
        const dancer = await this.userService.findById(dancerId);
        if (!dancer) {
            throw new NotFoundException('Dancer not found');
        }

        const userObjectId = new Types.ObjectId(userId);
        const likes = dancer.likes.map(id => id.toString());
        const userIndex = likes.indexOf(userId);

        if (userIndex === -1) {
            // User has not liked yet, so add the like
            dancer.likes.push(userObjectId);
        } else {
            // User has already liked, so remove the like
            dancer.likes.splice(userIndex, 1);
        }

        return await dancer.save();
    }
}
