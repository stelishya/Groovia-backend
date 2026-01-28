import { forwardRef, Inject, Injectable, NotFoundException, } from '@nestjs/common';
import { Model, Types, FilterQuery, SortOrder, UpdateQuery } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../../users/models/user.schema';
import { EventDocument, Events } from '../models/events.schema';
import { IClientService, PaymentInitiationResponse } from '../interfaces/client.interface';
import { NotificationType } from '../../notifications/models/notification.schema';
import { type IUserService, IUserServiceToken, } from '../../users/interfaces/user.service.interface';
import { type IStorageService, IStorageServiceToken, } from 'src/common/storage/interfaces/storage.interface';
import { type IPaymentService, IPaymentServiceToken, } from 'src/common/payments/interfaces/payment.interface';
import { type INotificationService, INotificationServiceToken } from '../../notifications/interfaces/notifications.service.interface';
import { CreateRequestDto, updateBookingStatusDto, UpdateClientProfileDto, } from '../dto/client.dto';
import { IPaymentsServiceToken, PaymentStatus, PaymentType, type IPaymentsService, } from '../../payments/interfaces/payments.service.interface';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface LeanEvent extends Omit<Events, '_id' | 'clientId' | 'dancerId'> {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  dancerId: Types.ObjectId;
  [key: string]: unknown;
}

interface PopulatedEvent extends Omit<Events, 'clientId' | 'dancerId'> {
  _id: Types.ObjectId;
  clientId: User & { _id: Types.ObjectId };
  dancerId: User & { _id: Types.ObjectId };
  [key: string]: unknown;
}
type SavedEvent = Events & { _id: Types.ObjectId };

@Injectable()
export class ClientService implements IClientService {
  constructor(
    @InjectModel(Events.name) private readonly _eventModel: Model<Events>,
    @Inject(IUserServiceToken)
    private readonly _userService: IUserService,
    @Inject(forwardRef(() => INotificationServiceToken))
    private readonly _notificationService: INotificationService,
    @Inject(IStorageServiceToken)
    private readonly _storageService: IStorageService,
    @Inject(IPaymentServiceToken)
    private readonly _paymentService: IPaymentService,
    @Inject(IPaymentsServiceToken)
    private readonly _paymentsService: IPaymentsService,
    private readonly _configService: ConfigService,
  ) { }

  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ user: User; imageUrl: string }> {
    const userObjectId = new Types.ObjectId(userId);
    const sanitizedName = file.originalname.replace(/\s+/g, '-');
    const fileName = `profiles/${userObjectId}-${Date.now()}-${sanitizedName}`;

    // Upload to S3
    const result = await this._storageService.uploadBuffer(
      file.buffer,
      fileName,
      file.mimetype,
    );

    // Update user profile with new image URL
    const updatedUser = await this.updateClientProfile(userId, {
      profileImage: result.Location,
    });

    return {
      user: updatedUser,
      imageUrl: result.Location,
    };
  }

  async getProfileByUserId(userId: string): Promise<User> {
    const user = await this._userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findOne(id: string): Promise<Events> {
    const event = await this._eventModel
      .findById(id)
      .populate('dancerId')
      .populate('clientId');
    if (!event) {
      throw new NotFoundException('Event Request not found');
    }
    return event;
  }

  async createEventBookingPayment(eventId: string, userId: string): Promise<PaymentInitiationResponse> {
    const event = await this._eventModel.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.clientId.toString() !== userId) {
      throw new Error('Unauthorized access to event');
    }

    if (event.status !== 'accepted') {
      throw new Error('Event request is not in accepted status');
    }

    const amount = event.acceptedAmount;
    if (!amount) {
      throw new Error('No accepted amount found for this event');
    }

    const eventIdString = event._id.toString();
    const order = await this._paymentService.createOrder(
      amount,
      'INR',
      eventIdString,
    );

    const razorpayKeyId = this._configService.get<string>('RAZORPAY_KEY_ID');
    if (!razorpayKeyId) {
      throw new Error('RAZORPAY_KEY_ID is not configured');
    }

    return {
      // ...order,
      id: order.id,
      entity: order.entity,
      key_id: razorpayKeyId,
      amount: amount,
      currency: 'INR',
      name: 'Groovia Event Booking',
      description: `Payment for event: ${event.event}`,
      prefill: {
        name: 'Client Name',
        email: 'client@example.com',
        contact: '',
      },
      notes: {
        eventId: eventIdString,
        type: 'event_booking',
      },
    };
  }

  async verifyEventBookingPayment(
    eventId: string,
    paymentDetails: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ): Promise<Events> {
    const isValid = await this._paymentService.verifyPayment(
      paymentDetails.razorpay_order_id,
      paymentDetails.razorpay_payment_id,
      paymentDetails.razorpay_signature,
    );
    console.log('isValid verifyEventBookingPayment', isValid);
    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    const updatedEvent = await this._eventModel.findByIdAndUpdate(
      eventId,
      {
        paymentStatus: 'paid',
        status: 'confirmed',
      },
      { new: true },
    );
    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }

    console.log('updatedEvent verifyEventBookingPayment', updatedEvent);

    // Record payment history
    await this._paymentsService.createRecord({
      userId: updatedEvent.clientId.toString(),
      amount: updatedEvent.acceptedAmount || 0,
      paymentType: PaymentType.EVENT_BOOKING,
      status: PaymentStatus.SUCCESS,
      referenceId: eventId,
      transactionId: paymentDetails.razorpay_payment_id,
      orderId: paymentDetails.razorpay_order_id,
      description: `Payment for event booking: ${updatedEvent.event}`,
    });

    return updatedEvent;
  }

  async markPaymentFailed(eventId: string, userId: string): Promise<Events | null> {
    const updatedEvent = await this._eventModel.findOneAndUpdate(
      { _id: eventId, paymentStatus: { $ne: 'failed' } },
      {
        paymentStatus: 'failed',
      },
      { new: true },
    );

    if (!updatedEvent) {
      // Return current state if no update occurred
      return this._eventModel.findById(eventId);
    }

    console.log('updatedEvent markPaymentFailed', updatedEvent);

    // Record failed payment
    await this._paymentsService.createRecord({
      userId,
      amount: updatedEvent.acceptedAmount || 0,
      paymentType: PaymentType.EVENT_BOOKING,
      status: PaymentStatus.FAILED,
      referenceId: eventId,
      description: `Failed payment for event booking: ${updatedEvent.event}`,
    });

    return updatedEvent;
  }

  async getAllDancers(options: {
    location?: string;
    sortBy?: string;
    page: number;
    limit: number;
    danceStyle?: string;
    search?: string;
    // role?: string,
    // availableForPrograms?: boolean
  }): Promise<{ dancers: User[]; total: number }> {
    // const { location, sortBy, page, limit, danceStyle, search } = options;
    const { location, sortBy, danceStyle, search } = options;
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;

    const query: FilterQuery<User> = {
      role: 'dancer',
      availableForPrograms: true,
    };
    if (location) {
      query.preferredLocation = { $regex: location, $options: 'i' };
    }
    if (danceStyle) {
      query.danceStyles = danceStyle;
    }
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }
    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy === 'likes') {
      sortOptions.likes = -1; // descending order (most likes first)
    } else if (sortBy === 'name') {
      sortOptions.username = 1; // ascending order (A-Z)
    }

    const dancers = await this._userService.findDancersWithFilters(
      query,
      (page - 1) * limit,
      limit,
      sortOptions,
    );
    const total = await this._userService.count(query);
    return { dancers, total };
  }

  async getDancerProfile(dancerId: string): Promise<User> {
    const dancer = await this._userService.findById(dancerId);
    if (!dancer) {
      throw new NotFoundException('Dancer not found');
    }
    return dancer;
  }

  async createEventRequest(
    createRequestDto: CreateRequestDto,
    clientId: string,
  ): Promise<Events> {
    const requestPayload = {
      ...createRequestDto,
      clientId: new Types.ObjectId(clientId),
    };
    const newRequest = new this._eventModel(requestPayload);
    const savedRequest = await newRequest.save();

    // Get client details for notification
    const client = await this._userService.findById(clientId);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    const savedRequestId = savedRequest._id.toString();
    // Create notification for dancer
    await this._notificationService.createNotification(
      new Types.ObjectId(createRequestDto.dancerId),
      NotificationType.EVENT_REQUEST_RECEIVED,
      'New Event Request',
      `You have a new event request from ${client.username}`,
      undefined,
      {
        eventId: savedRequestId,
        clientId: client._id.toString(),
        clientName: client.username || 'A client',
        eventType: createRequestDto.event,
        // eventDate: createRequestDto.date instanceof Date ? createRequestDto.date : new Date(createRequestDto.date),
        eventDate: createRequestDto.date
          ? new Date(createRequestDto.date)
          : new Date(),
        venue: createRequestDto.venue,
      },
    );

    return savedRequest;
  }

  async getEventRequests(
    clientId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      sortBy?: string;
    },
  ): Promise<{ requests: Events[]; total: number }> {
    const { page, limit, search, status, sortBy } = options;
    const query: FilterQuery<Events> = { clientId };

    if (search) {
      query.event = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    const sortOptions: Record<string, SortOrder> = {};
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

  async updateEventRequestStatus(
    eventId: string,
    statusDto: updateBookingStatusDto,
  ): Promise<Events> {
    const event = await this._eventModel
      .findById(eventId)
      .populate<{ clientId: User; dancerId: User }>([
        { path: 'clientId', select: 'username' },
        { path: 'dancerId', select: 'username' },
      ])
      // .populate('dancerId', 'username')
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Update the event status
    // event.status = statusDto.status;
    // const updatedEvent = await event.save();
    // Helper function to check if a field is populated
    const isUserPopulated = (field: Types.ObjectId | User | UserDocument | Record<string, unknown>): field is (User & { _id: Types.ObjectId }) => {
      return field && typeof field === 'object' && 'username' in field && '_id' in field;
    };

    if (!isUserPopulated(event.clientId) || !isUserPopulated(event.dancerId)) {
      throw new Error('Failed to populate event with user data');
    }

    // Now TypeScript knows clientId and dancerId are Users (UserDocuments)
    const clientUser = event.clientId;
    const dancerUser = event.dancerId;

    const updateData: UpdateQuery<Events> = { status: statusDto.status };
    if (statusDto.status === 'accepted' && statusDto.amount) {
      updateData.acceptedAmount = statusDto.amount;
    }

    const updatedEvent = await this._eventModel
      .findByIdAndUpdate(eventId, updateData, { new: true, lean: true })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Failed to update event ${eventId}`);
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
    await this._notificationService.createNotification(
      new Types.ObjectId(recipientId),
      notificationType,
      title,
      message,
      undefined,
      {
        eventId: updatedEvent._id.toString(),
        eventType: updatedEvent.event,
        eventDate:
          updatedEvent.date instanceof Date
            ? updatedEvent.date
            : new Date(updatedEvent.date),
        venue: updatedEvent.venue,
        status: statusDto.status,
      },
    );

    return updatedEvent as unknown as Events;
  }

  async updateClientProfile(
    userId: string,
    updateData: UpdateClientProfileDto,
  ): Promise<User> {
    const user = await this._userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this._userService.findByUsername(
        updateData.username,
      );
      if (existingUser) {
        throw new NotFoundException('Username already taken');
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this._userService.findByEmail(
        updateData.email,
      );
      if (existingUser) {
        throw new NotFoundException('Email already in use');
      }
    }

    // Update only provided fields
    const updatedUser = await this._userService.updateOne(
      { _id: user._id },
      { $set: updateData },
    );

    if (!updatedUser) {
      throw new NotFoundException('Failed to update profile');
    }

    console.log('Updated user in service:', updatedUser);

    // Remove password from response
    const userDoc = updatedUser as UserDocument;
    const userObject = userDoc.toObject ? userDoc.toObject() : userDoc;

    const { password, ...userWithoutPassword } = userObject as User & { password?: string };

    return userWithoutPassword as User;
  }
}
