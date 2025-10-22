import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UpdateDancerProfileDto } from './dto/dancer.dto';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';

@Injectable()
export class DancerService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService
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
}
