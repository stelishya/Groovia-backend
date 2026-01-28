import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UpgradeRequest,
  UpgradeRequestStatus,
  UpgradeRequestDocument,
} from '../models/upgrade-request.schema';
import { User } from '../../models/user.schema';
import { IUpgradeRequestService } from '../interface/upgrade-request.service.interface';
import {
  IUpgradeRequestRepoToken,
  type IUpgradeRequestRepo,
} from '../interface/upgrade-request.repo.interface';
import { INotificationServiceToken } from 'src/modules/notifications/interfaces/notifications.service.interface';
import type { INotificationService } from 'src/modules/notifications/interfaces/notifications.service.interface';
import { NotificationType } from 'src/modules/notifications/models/notification.schema';
import { Role } from 'src/common/enums/role.enum';
import {
  type IPaymentService,
  IPaymentServiceToken,
} from 'src/common/payments/interfaces/payment.interface';
import {
  CreateUpgradeRequestDto,
  PaymentConfirmationResponse,
  PaymentFailedResponse,
  PaymentOrderResponse,
  UserUpgradeRequestResponse,
} from '../dto/upgrade-request.dto';
import {
  IPaymentsServiceToken,
  PaymentStatus,
  PaymentType,
} from '../../../payments/interfaces/payments.service.interface';
import type { IPaymentsService } from '../../../payments/interfaces/payments.service.interface';

@Injectable()
export class UpgradeRequestService implements IUpgradeRequestService {
  constructor(
    @Inject(IUpgradeRequestRepoToken)
    private upgradeRequestRepo: IUpgradeRequestRepo,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @Inject(INotificationServiceToken)
    private notificationService: INotificationService,
    @Inject(IPaymentServiceToken)
    private razorpayService: IPaymentService,
    @Inject(IPaymentsServiceToken)
    private paymentsService: IPaymentsService,
  ) {}

  async createRequest(
    data: CreateUpgradeRequestDto,
  ): Promise<UpgradeRequestDocument> {
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
      throw new BadRequestException(
        'No eligible upgrade available for this user',
      );
    }

    // Check if there's already a pending request
    const existingRequest = await this.upgradeRequestRepo.findOne({
      userId: user._id,
      status: UpgradeRequestStatus.PENDING,
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending upgrade request',
      );
    }

    return await this.upgradeRequestRepo.create({
      ...data,
      userId: user._id,
      username: user.username,
      email: user.email,
    });
  }

  async getAllRequests(): Promise<UpgradeRequestDocument[]> {
    return await this.upgradeRequestRepo.find({});
  }

  async getPendingRequests(): Promise<UpgradeRequestDocument[]> {
    return await this.upgradeRequestRepo.find({
      status: UpgradeRequestStatus.PENDING,
    });
  }

  async getRequestsByUser(
    userId: string,
  ): Promise<UserUpgradeRequestResponse[]> {
    console.log(
      'getRequestsByUser called with userId (string):',
      userId,
      typeof userId,
    );
    const oid = new Types.ObjectId(userId);
    console.log('converted userId to ObjectId:', oid);

    const [requests, user] = await Promise.all([
      this.upgradeRequestRepo.find({ userId: oid }),
      // .sort({ createdAt: -1 })
      // .exec(),
      this.userModel.findById(userId).lean(),
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

    return requests.map((r) => ({
      id: r._id.toString(),
      type,
      status: r.status,
      paymentStatus: r.paymentStatus || 'pending',
      approvedAt:
        r.status === UpgradeRequestStatus.APPROVED ? r.reviewedAt : undefined,
      rejectedAt:
        r.status === UpgradeRequestStatus.REJECTED ? r.reviewedAt : undefined,
      adminMessage: r.adminNote,
    }));
  }

  async approveRequest(
    id: string,
    adminNote?: string,
  ): Promise<UpgradeRequestDocument> {
    console.log('HLO i am approveRequest function !!');
    const request = await this.upgradeRequestRepo.findById(id);

    if (!request) {
      throw new NotFoundException('Upgrade request not found');
    }

    console.log(
      'request in approveRequest in upgrade-request.service.ts',
      request,
    );
    const userBefore = await this.userModel.findById(request.userId);
    if (!userBefore) {
      throw new NotFoundException('User not found');
    }

    console.log(
      'User roles before approval:',
      userBefore?.role || 'user not found',
    );

    if (request.status !== UpgradeRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // // Update user role
    // await this.userModel.findByIdAndUpdate(
    //     request.userId,
    //     { $addToSet: { role: Role.INSTRUCTOR } }
    // );

    // return await request.save();
    const savedRequest = await this.upgradeRequestRepo.update(
      request._id.toString(),
      {
        status: UpgradeRequestStatus.APPROVED,
        paymentStatus: 'pending',
        adminNote,
        reviewedAt: new Date(),
      },
    );

    if (!savedRequest) {
      throw new NotFoundException('Upgrade request not found after update');
    }

    const userAfter = await this.userModel.findById(request.userId);
    if (!userAfter) {
      throw new NotFoundException('User not found');
    }
    console.log(
      'User roles after approval:',
      userAfter?.role || 'user not found',
    );
    console.log(
      'savedRequest in approveRequest in upgrade-request.service.ts',
      savedRequest,
    );

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

  async createPaymentOrder(
    userId: string,
    upgradeRequestId: string,
    amount: number,
    currency: string,
  ): Promise<PaymentOrderResponse> {
    const request = await this.upgradeRequestRepo.findById(upgradeRequestId);
    console.log(
      'request in createPaymentOrder in upgrade-request.service.ts',
      request,
    );
    if (!request) {
      throw new NotFoundException('Upgrade request not found');
    }
    if (request.userId.toString() !== userId) {
      throw new BadRequestException(
        'Request does not belong to the current user',
      );
    }
    if (request.status !== UpgradeRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Payment can only be initiated for approved requests',
      );
    }

    const order = await this.razorpayService.createOrder(
      amount,
      currency,
      upgradeRequestId,
    );

    // Update request status to payment_pending if not already
    if (request.paymentStatus !== 'paid') {
      await this.upgradeRequestRepo.update(request._id.toString(), {
        paymentStatus: 'pending',
      });
    }
    console.log(
      'order in createPaymentOrder in upgrade-request.service.ts',
      order,
    );
    return order as unknown as PaymentOrderResponse;
  }

  async confirmPayment(
    userId: string,
    upgradeRequestId: string,
    paymentId: string,
    amount: number,
    currency: string,
    razorpayOrderId?: string,
    razorpaySignature?: string,
  ): Promise<PaymentConfirmationResponse> {
    console.log('confirmPayment called with:', {
      userId,
      upgradeRequestId,
      paymentId,
      amount,
      currency,
      razorpayOrderId,
      razorpaySignature,
    });

    const request = await this.upgradeRequestRepo.findById(upgradeRequestId);
    console.log(
      'request in confirmPayment in upgrade-request.service.ts',
      request,
    );

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
      throw new BadRequestException(
        'Request does not belong to the current user',
      );
    }
    if (request.status !== UpgradeRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Payment can only be confirmed for approved requests',
      );
    }

    // Verify payment if signature is provided
    if (razorpayOrderId && razorpaySignature) {
      const isValid = this.razorpayService.verifyPayment(
        razorpayOrderId,
        paymentId,
        razorpaySignature,
      );
      if (!isValid) {
        throw new BadRequestException('Invalid payment signature');
      }
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

    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { role: roleToAssign },
    });

    await this.upgradeRequestRepo.update(upgradeRequestId, {
      paymentStatus: 'paid',
    });

    await this.notificationService.createNotification(
      user._id,
      NotificationType.UPGRADE_APPROVED,
      'Upgrade Payment Confirmed',
      'Your role upgrade is completed. Enjoy the new features!',
    );

    // Record payment history
    await this.paymentsService.createRecord({
      userId: user._id.toString(),
      amount,
      paymentType: PaymentType.ROLE_UPGRADE,
      status: PaymentStatus.SUCCESS,
      referenceId: upgradeRequestId,
      transactionId: paymentId,
      orderId: razorpayOrderId,
      description: `Role upgrade to ${roleToAssign}`,
    });

    return { success: true };
  }

  async rejectRequest(
    id: string,
    adminNote?: string,
  ): Promise<UpgradeRequestDocument> {
    const request = await this.upgradeRequestRepo.findById(id);
    if (!request) {
      throw new NotFoundException('Upgrade request not found');
    }

    if (request.status !== UpgradeRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // return await request.save();
    const savedRequest = await this.upgradeRequestRepo.update(
      request._id.toString(),
      {
        status: UpgradeRequestStatus.REJECTED,
        adminNote,
        reviewedAt: new Date(),
      },
    );

    if (!savedRequest) throw new NotFoundException('Request not found');

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

  async upgradePaymentFailed(
    userId: string,
    requestId: string,
  ): Promise<PaymentFailedResponse> {
    const request = await this.upgradeRequestRepo.findById(requestId);
    if (!request) {
      throw new NotFoundException('Upgrade request not found');
    }

    if (request.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You can only update your own upgrade requests',
      );
    }

    await this.upgradeRequestRepo.update(request._id.toString(), {
      paymentStatus: 'failed',
    });

    // Record failed payment
    await this.paymentsService.createRecord({
      userId,
      amount: 0,
      paymentType: PaymentType.ROLE_UPGRADE,
      status: PaymentStatus.FAILED,
      referenceId: requestId,
      description: `Failed payment for role upgrade`,
    });

    return { message: 'Payment failed', request };
  }
}
