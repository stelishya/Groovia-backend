import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpgradeRequest, UpgradeRequestStatus } from '../models/upgrade-request.schema';
import { User } from '../models/user.schema';
import { IUpgradeRequestService } from '../interfaces/upgrade-request.service.interface';
import { NotificationService } from 'src/modules/notifications/services/notification.service';
import { NotificationType } from 'src/modules/notifications/models/notification.schema';

@Injectable()
export class UpgradeRequestService implements IUpgradeRequestService {
    constructor(
        @InjectModel(UpgradeRequest.name) private upgradeRequestModel: Model<UpgradeRequest>,
        @InjectModel(User.name) 
        private userModel: Model<User>,
        private notificationService: NotificationService,
    ) {}

    async createRequest(data: any): Promise<UpgradeRequest> {
        // Find user by email
        const user = await this.userModel.findOne({ email: data.email });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if user already has instructor role
        if (user.role.includes('instructor')) {
            throw new BadRequestException('User already has instructor role');
        }

        // Check if there's already a pending request
        const existingRequest = await this.upgradeRequestModel.findOne({
            userId: user._id,
            status: UpgradeRequestStatus.PENDING
        });

        if (existingRequest) {
            throw new BadRequestException('You already have a pending upgrade request');
        }

        const upgradeRequest = new this.upgradeRequestModel({
            userId: user._id,
            username: user.username,
            email: user.email,
            ...data
        });

        return await upgradeRequest.save();
    }

    async getAllRequests(): Promise<UpgradeRequest[]> {
        return await this.upgradeRequestModel
            .find()
            .sort({ createdAt: -1 })
            .exec();
    }

    async getPendingRequests(): Promise<UpgradeRequest[]> {
        return await this.upgradeRequestModel
            .find({ status: UpgradeRequestStatus.PENDING })
            .sort({ createdAt: -1 })
            .exec();
    }

    async approveRequest(id: string, adminNote?: string): Promise<UpgradeRequest> {
        const request = await this.upgradeRequestModel.findById(id);
        if (!request) {
            throw new NotFoundException('Upgrade request not found');
        }

        if (request.status !== UpgradeRequestStatus.PENDING) {
            throw new BadRequestException('Request has already been processed');
        }

        // Update user role
        await this.userModel.findByIdAndUpdate(
            request.userId,
            { $addToSet: { role: 'instructor' } }
        );

        // Update request status
        request.status = UpgradeRequestStatus.APPROVED;
        request.adminNote = adminNote;
        request.reviewedAt = new Date();

        // return await request.save();
         const savedRequest = await request.save();
 // Create notification for user
 await this.notificationService.createNotification(
 request.userId,
 NotificationType.UPGRADE_APPROVED,
 'Upgrade Request Approved! 🎉',
 'Congratulations! Your instructor upgrade request has been approved. You can now access instructor features.',
 adminNote,
 );
 return savedRequest;
    }

    async rejectRequest(id: string, adminNote?: string): Promise<UpgradeRequest> {
        const request = await this.upgradeRequestModel.findById(id);
        if (!request) {
            throw new NotFoundException('Upgrade request not found');
        }

        if (request.status !== UpgradeRequestStatus.PENDING) {
            throw new BadRequestException('Request has already been processed');
        }

        request.status = UpgradeRequestStatus.REJECTED;
        request.adminNote = adminNote;
        request.reviewedAt = new Date();

        // return await request.save();
         const savedRequest = await request.save();
 // Create notification for user
 await this.notificationService.createNotification(
 request.userId,
 NotificationType.UPGRADE_REJECTED,
 'Upgrade Request Rejected',
 'Your instructor upgrade request was not approved at this time. Please check the admin note for more details.',
 adminNote,
 );
 return savedRequest;
    }
}