import { BadRequestException, ConsoleLogger, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UpdateDancerProfileDto } from './dto/dancer.dto';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { User } from '../users/models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Events } from '../client/models/events.schema';
import { type IStorageService, IStorageServiceToken } from 'src/common/storage/interfaces/storage.interface';
import { IDancerService } from './interfaces/dancer.interface';

@Injectable()
export class DancerService implements IDancerService {
    constructor(
        @Inject(IUserServiceToken)
        private readonly userService: IUserService,
        @InjectModel(Events.name) private readonly _eventModel: Model<Events>,
        @Inject(IStorageServiceToken)
        private readonly storageService: IStorageService
    ) { }

    async getProfileByUserId(userId: string): Promise<User> {
        const user = await this.userService.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<{ user: User; imageUrl: string }> {
        const userObjectId = new Types.ObjectId(userId);
        const fileName = `profiles/${userObjectId}-${Date.now()}-${file.originalname}`;

        // Upload to S3
        const result = await this.storageService.uploadBuffer(
            file.buffer,
            fileName,
            file.mimetype
        );

        // Update user profile with new image URL
        const userDetails = await this.updateProfile(userId, {
            profileImage: result.Location
        });

        return {
            user: userDetails,
            imageUrl: result.Location
        };
    }

    async uploadCertificate(userId: string, file: Express.Multer.File, certificateName?: string): Promise<any> {
        const userObjectId = new Types.ObjectId(userId);
        const fileName = `certificates/${userObjectId}/${Date.now()}-${file.originalname}`;

        // Upload to S3
        const result = await this.storageService.uploadBuffer(
            file.buffer,
            fileName,
            file.mimetype
        );

        // Get file extension
        const fileType = file.originalname.split('.').pop()?.toLowerCase();

        // Use provided name or filename without extension
        const name = certificateName || file.originalname.replace(/\.[^/.]+$/, '');

        // Get current user
        const user = await this.userService.findOne({ _id: userObjectId });
        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Create new certificate object
        const newCertificate = {
            name,
            url: result.Location,
            fileType
        };

        if (!newCertificate.url) {
            throw new Error("Failed to generate certificate URL");
        }

        console.log("S3 Upload Result:", result);
        console.log("New Certificate Object:", newCertificate);

        // Return the new certificate object without saving to DB yet
        // The frontend will add this to the form state, and it will be saved when the user clicks "Save Changes"
        return newCertificate;
    }

    async updateProfile(userId: string | Types.ObjectId, updateData: UpdateDancerProfileDto) {
        console.log("updateProfile in dancer.service.ts")

        const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

        if (updateData.username) {
            const existingUsername = await this.userService.findByUsername(updateData.username);
            if (existingUsername && existingUsername._id.toString() !== userIdObj.toString()) {
                throw new BadRequestException('Username already exists');
            }
        }
        // Check if email is being updated and if it already exists
        if (updateData.email) {
            const existingUserWithEmail = await this.userService.findByEmail(updateData.email);
            if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userIdObj.toString()) {
                throw new BadRequestException('Email already exists');
            }
        }

        // Update user in database
        const updatedUser = await this.userService.updateOne(
            { _id: userIdObj },
            { $set: updateData }
        );
        if (!updatedUser) {
            throw new Error('Failed to update profile');
        }
        // Convert to plain object and remove sensitive data
        const userObject = (updatedUser as any).toJSON ? (updatedUser as any).toJSON() : updatedUser;
        const { password, ...userDetails } = userObject as any;
        console.log("userDetails in dancer.service.ts", userDetails)
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
        if (!Types.ObjectId.isValid(dancerId)) {
            throw new BadRequestException('Invalid Dancer ID');
        }
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid User ID');
        }

        const dancer = await this.userService.findById(dancerId);
        if (!dancer) {
            throw new NotFoundException('Dancer not found');
        }

        const userObjectId = new Types.ObjectId(userId);

        // Check if user has already liked
        // Ensure likes is an array before calling some
        const likes = Array.isArray(dancer.likes) ? dancer.likes : [];
        const isLiked = likes.some(id => id.toString() === userId);

        let updatedDancer;
        if (isLiked) {
            // User has already liked, so remove the like
            updatedDancer = await this.userService.updateOne(
                { _id: new Types.ObjectId(dancerId) },
                { $pull: { likes: userObjectId } }
            );
        } else {
            // User has not liked yet, so add the like
            updatedDancer = await this.userService.updateOne(
                { _id: new Types.ObjectId(dancerId) },
                { $addToSet: { likes: userObjectId } }
            );
        }

        if (!updatedDancer) {
            throw new BadRequestException('Failed to update like status');
        }

        return updatedDancer;
    }
}
