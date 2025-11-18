import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UpgradeRequest, UpgradeRequestStatus } from '../models/upgrade-request.schema';
import { User } from '../models/user.schema';
import { IUpgradeRequestService } from '../interfaces/upgrade-request.service.interface';
import { NotificationService } from 'src/modules/notifications/services/notification.service';
import { NotificationType } from 'src/modules/notifications/models/notification.schema';
import { Role } from 'src/common/enums/role.enum';

@Injectable()
export class UpgradeRequestService implements IUpgradeRequestService {
    constructor(
        @InjectModel(UpgradeRequest.name) private upgradeRequestModel: Model<UpgradeRequest>,
        @InjectModel(User.name)
        private userModel: Model<User>,
        private notificationService: NotificationService,
    ) { }

    async createRequest(data: any): Promise<UpgradeRequest> {
        // Find user by email
        const user = await this.userModel.findOne({ email: data.email });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Derive target role from user's current roles
        const isDancer = user.role.includes(Role.DANCER);
        const isClient = user.role.includes(Role.CLIENT);
        const hasInstructor = user.role.includes(Role.INSTRUCTOR);
        const hasOrganizer = user.role.includes(Role.ORGANIZER);

        let targetRole: Role | null = null;
        if (isDancer && !hasInstructor) {
            targetRole = Role.INSTRUCTOR;
        } else if (isClient && !hasOrganizer) {
            targetRole = Role.ORGANIZER;
        }

        if (!targetRole) {
            throw new BadRequestException('No eligible upgrade available for this user');
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

    async getRequestsByUser(userId: string): Promise<any[]> {
        console.log('getRequestsByUser called with userId (string):', userId, typeof userId);
        const oid = new Types.ObjectId(userId);
        console.log('converted userId to ObjectId:', oid);
        const [requests, user] = await Promise.all([
            this.upgradeRequestModel
                .find({ userId: oid })
                .sort({ createdAt: -1 })
                .exec(),
            this.userModel.findById(userId).lean()
        ]);
        console.log('raw requests from DB:', requests);

        let type: 'instructor' | 'organizer' = 'instructor';
        if (user) {
            if (user.role?.includes(Role.DANCER)) {
                type = 'instructor';
            } else if (user.role?.includes(Role.CLIENT)) {
                type = 'organizer';
            }
        }

        return requests.map((r: any) => ({
            id: r._id.toString(),
            type,
            status: r.status,
            paymentStatus: r.paymentStatus,
            approvedAt: r.status === UpgradeRequestStatus.APPROVED ? r.reviewedAt : undefined,
            rejectedAt: r.status === UpgradeRequestStatus.REJECTED ? r.reviewedAt : undefined,
            adminMessage: r.adminNote,
        }));
    }

    async approveRequest(id: string, adminNote?: string): Promise<UpgradeRequest> {
        console.log("HLO i am approveRequest function !!")
        const request = await this.upgradeRequestModel.findById(id);

        if (!request) {
            throw new NotFoundException('Upgrade request not found');
        }

        console.log("request in approveRequest in upgrade-request.service.ts", request)
        const userBefore = await this.userModel.findById(request.userId);
        if (!userBefore) {
            throw new NotFoundException('User not found');
        }

        console.log('User roles before approval:', userBefore?.role || 'user not found');

        if (request.status !== UpgradeRequestStatus.PENDING) {
            throw new BadRequestException('Request has already been processed');
        }

        // // Update user role
        // await this.userModel.findByIdAndUpdate(
        //     request.userId,
        //     { $addToSet: { role: Role.INSTRUCTOR } }
        // );

        // Update request status
        request.status = UpgradeRequestStatus.APPROVED;
        request.paymentStatus = "pending";
        request.adminNote = adminNote;
        request.reviewedAt = new Date();

        // return await request.save();
        const savedRequest = await request.save();
        const userAfter = await this.userModel.findById(request.userId);
        if (!userAfter) {
            throw new NotFoundException('User not found');
        }
        console.log('User roles after approval:', userAfter?.role || 'user not found');
        console.log("savedRequest in approveRequest in upgrade-request.service.ts", savedRequest)

        // Create notification for user
        await this.notificationService.createNotification(
            request.userId,
            NotificationType.UPGRADE_APPROVED,
            'Your upgrade request was approved',
            'Complete the payment to activate your new role.',
            adminNote,
        );
        return savedRequest;
    }

    async confirmPayment(userId: string, upgradeRequestId: string, paymentId: string, amount: number, currency: string): Promise<{ success: boolean }> {
        console.log('confirmPayment called with:', { userId, upgradeRequestId, paymentId, amount, currency });

        const request = await this.upgradeRequestModel.findById(upgradeRequestId);
        console.log('request in confirmPayment in upgrade-request.service.ts', request)

        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid userId');
        }
        if (!upgradeRequestId || !Types.ObjectId.isValid(upgradeRequestId)) {
            throw new BadRequestException('Invalid upgradeRequestId');
        }

        if (!request || !request.userId) {
            throw new NotFoundException('Upgrade request or userId missing');
        }
        if (request.userId.toString() !== userId.toString()) {
            throw new BadRequestException('Request does not belong to the current user');
        }
        if (request.status !== UpgradeRequestStatus.APPROVED) {
            throw new BadRequestException('Payment can only be confirmed for approved requests');
        }

        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isDancer = user.role.includes(Role.DANCER);
        const isClient = user.role.includes(Role.CLIENT);
        const hasInstructor = user.role.includes(Role.INSTRUCTOR);
        const hasOrganizer = user.role.includes(Role.ORGANIZER);

        let roleToAssign: Role | null = null;
        if (isDancer && !hasInstructor) {
            roleToAssign = Role.INSTRUCTOR;
        } else if (isClient && !hasOrganizer) {
            roleToAssign = Role.ORGANIZER;
        }

        if (!roleToAssign) {
            throw new BadRequestException('No eligible role to assign for this user');
        }

        await this.userModel.findByIdAndUpdate(userId, { $addToSet: { role: roleToAssign } });

        await this.upgradeRequestModel.findByIdAndUpdate(upgradeRequestId, { paymentStatus: 'paid' });

        await this.notificationService.createNotification(
            user._id,
            NotificationType.UPGRADE_APPROVED,
            'Upgrade Payment Confirmed',
            'Your role upgrade is completed. Enjoy the new features!'
        );

        return { success: true };
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