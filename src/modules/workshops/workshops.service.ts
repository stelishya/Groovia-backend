import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types, FilterQuery, SortOrder, PipelineStage } from 'mongoose';
import { Workshop, WorkshopDocument } from './models/workshop.schema';
import { CreateWorkshopDto } from './dto/workshop.dto';

import {
  type IWorkshopRepo,
  IWorkshopRepoToken,
} from './interfaces/workshop.repo.interface';
import {
  BookingConfirmationResponse,
  IWorkshopService,
  PaginatedBookedWorkshops,
  PaymentInitiationResponse,
  WorkshopParticipant,
} from './interfaces/workshop.service.interface';
import {
  type IStorageService,
  IStorageServiceToken,
} from 'src/common/storage/interfaces/storage.interface';
import {
  type IPaymentService,
  IPaymentServiceToken,
} from 'src/common/payments/interfaces/payment.interface';
import {
  IPaymentsServiceToken,
  PaymentStatus,
  PaymentType,
} from '../payments/interfaces/payments.service.interface';
import type { IPaymentsService } from '../payments/interfaces/payments.service.interface';
import { StorageUtils } from 'src/common/storage/utils/storage.utils';
import { NotificationService } from '../notifications/services/notification.service';
import { NotificationType } from '../notifications/models/notification.schema';
import {
  type INotificationService,
  INotificationServiceToken,
} from '../notifications/interfaces/notifications.service.interface';
import {
  type IUserService,
  IUserServiceToken,
} from '../users/interfaces/user.service.interface';
import { User } from '../users/models/user.schema';

@Injectable()
export class WorkshopsService implements IWorkshopService {
  constructor(
    @Inject(IWorkshopRepoToken)
    private readonly _workshopRepository: IWorkshopRepo,
    @Inject(IStorageServiceToken)
    private readonly awsS3Service: IStorageService,
    @Inject(IPaymentServiceToken)
    private readonly razorpayService: IPaymentService,
    @Inject(IPaymentsServiceToken)
    private readonly paymentsService: IPaymentsService,
    @Inject(INotificationServiceToken)
    private readonly notificationService: INotificationService,
    @Inject(IUserServiceToken)
    private readonly _usersService: IUserService,
  ) {}

  async create(
    body: CreateWorkshopDto,
    file: Express.Multer.File,
    instructorId: string,
  ): Promise<Workshop> {
    console.log('Creating workshop with instructorId:', instructorId);
    console.log('Workshop data:', body);

    const createWorkshopDto: CreateWorkshopDto = {
      ...body,
      fee: Number(body.fee),
      maxParticipants: Number(body.maxParticipants),
      sessions:
        typeof body.sessions === 'string'
          ? JSON.parse(body.sessions)
          : body.sessions,
      posterImage: '',
    };

    let posterImage = createWorkshopDto.posterImage;

    // Upload file to S3 if provided
    if (file && file.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const sanitizedName = file.originalname.replace(/\s+/g, '-');
      const fileName = `workshops / ${uniqueSuffix} -${sanitizedName} `;
      const uploadResult = await this.awsS3Service.uploadBuffer(
        file.buffer,
        fileName,
        file.mimetype,
      );
      posterImage = uploadResult.Location;
      console.log('Image uploaded to S3:', posterImage);
    }

    const workshopData = {
      ...createWorkshopDto,
      posterImage,
      instructor: new Types.ObjectId(instructorId),
    };

    const savedWorkshop = await this._workshopRepository.create(workshopData);
    console.log('Workshop created successfully:', {
      id: savedWorkshop._id,
      title: savedWorkshop.title,
      instructor: savedWorkshop.instructor,
    });

    // Return with signed URL
    const workshopObj = savedWorkshop.toObject
      ? savedWorkshop.toObject()
      : savedWorkshop;
    return this.addSignedUrlsToWorkshop(workshopObj);
  }

  async findAll(query: FilterQuery<Workshop>): Promise<{
    workshops: Workshop[];
    total: number;
    page: number;
    limit: number;
  }> {
    const start = Date.now();
    console.log(`findAll request started at ${start} `);

    const { workshops, total, page, limit } =
      await this._workshopRepository.findAllWithFilters(query);
    const dbTime = Date.now() - start;
    console.log(`DB Query took ${dbTime} ms`);

    // Add signed URLs to all workshops
    const signStart = Date.now();
    const workshopsWithUrls = await Promise.all(
      workshops.map(async (workshop) => {
        const workshopObj =
          workshop &&
          typeof (workshop as WorkshopDocument).toObject === 'function'
            ? (workshop as WorkshopDocument).toObject()
            : workshop;
        return this.addSignedUrlsToWorkshop(workshopObj);
      }),
    );
    const signTime = Date.now() - signStart;
    console.log(`Signing took ${signTime} ms`);
    console.log(`Total findAll took ${Date.now() - start} ms`);

    return {
      workshops: workshopsWithUrls,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Workshop> {
    const workshop = await this._workshopRepository.findById(id);
    if (!workshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }

    // Return with signed URL
    const workshopObj = workshop.toObject ? workshop.toObject() : workshop;
    return this.addSignedUrlsToWorkshop(workshopObj);
  }

  async update(
    id: string,
    updateWorkshopDto: Partial<CreateWorkshopDto>,
    file: Express.Multer.File,
  ): Promise<Workshop> {
    const updateData: Partial<CreateWorkshopDto> & {
      posterImage?: string;
      participants?: string | WorkshopParticipant[];
      sessions?: string | unknown[];
    } = { ...updateWorkshopDto };

    // Parse sessions if it's a string
    if (updateData.sessions && typeof updateData.sessions === 'string') {
      try {
        updateData.sessions = JSON.parse(updateData.sessions);
      } catch (error) {
        console.error('Failed to parse sessions:', error);
        throw new BadRequestException('Invalid sessions format');
      }
    }

    // Parse participants if it's a string
    if (
      updateData.participants &&
      typeof updateData.participants === 'string'
    ) {
      try {
        updateData.participants = JSON.parse(updateData.participants);
      } catch (error) {
        console.error('Failed to parse participants:', error);
        throw new BadRequestException('Invalid participants format');
      }
    }
    // If a new file is uploaded, upload to S3
    if (file && file.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `workshops / ${uniqueSuffix} -${file.originalname} `;
      const uploadResult = await this.awsS3Service.uploadBuffer(
        file.buffer,
        fileName,
        file.mimetype,
      );
      updateData.posterImage = uploadResult.Location;
    }

    const updatedWorkshop = await this._workshopRepository.update(
      id,
      updateData,
    );

    if (!updatedWorkshop) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }

    // Return with signed URL
    const workshopObj = updatedWorkshop.toObject
      ? updatedWorkshop.toObject()
      : updatedWorkshop;
    return this.addSignedUrlsToWorkshop(workshopObj);
  }

  async remove(id: string): Promise<void> {
    const result = await this._workshopRepository.delete(id);
    if (!result) {
      throw new NotFoundException(`Workshop with ID ${id} not found`);
    }
  }

  async getInstructorWorkshops(instructorId: string): Promise<Workshop[]> {
    const workshops =
      await this._workshopRepository.findByInstructor(instructorId);

    // Add signed URLs to all workshops
    return Promise.all(
      workshops.map(async (workshop) => {
        const workshopObj = workshop.toObject ? workshop.toObject() : workshop;
        return this.addSignedUrlsToWorkshop(workshopObj);
      }),
    );
  }

  async confirmWorkshopBooking(
    workshopId: string,
    userId: string,
    paymentId: string,
    orderId: string,
    signature: string,
  ): Promise<BookingConfirmationResponse> {
    const workshop = await this._workshopRepository.findById(workshopId);

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Initialize participants array if needed
    if (!workshop.participants) {
      workshop.participants = [];
    }

    const participants =
      workshop.participants as unknown as WorkshopParticipant[];

    // Check if user already has a participant entry (e.g., from a failed payment)
    const participantIndex = participants.findIndex(
      (p) => p.dancerId.toString() === userId,
    );

    if (participantIndex !== -1) {
      // Update existing participant's payment status to 'paid'
      workshop.participants[participantIndex].paymentStatus = 'paid';
      workshop.participants[participantIndex].registeredAt = new Date();
    } else {
      // Create new participant object strictly typed
      const newParticipant: WorkshopParticipant = {
        dancerId: new Types.ObjectId(userId),
        paymentStatus: 'paid',
        attendance: false,
        registeredAt: new Date(),
      };
      (workshop.participants as unknown as WorkshopParticipant[]).push(
        newParticipant,
      );
      // workshop.participants.push({
      //   dancerId: new Types.ObjectId(userId),
      //   paymentStatus: 'paid',
      //   attendance: false,
      //   registeredAt: new Date(),
      // });
    }

    await this._workshopRepository.save(workshop);

    // Record payment history
    await this.paymentsService.createRecord({
      userId,
      amount: workshop.fee,
      paymentType: PaymentType.WORKSHOP,
      status: PaymentStatus.SUCCESS,
      referenceId: workshopId,
      transactionId: paymentId,
      orderId: orderId,
      description: `Registration for workshop: ${workshop.title} `,
    });

    // const dancerId = workshop.participants.find(
    //   (p) => p.dancerId.toString() === userId,
    // )?.dancerId;
    // const user = await this._usersService.findById(dancerId ?? '');
    // Handle User fetching safely
    const currentParticipant = (
      workshop.participants as unknown as WorkshopParticipant[]
    ).find((p) => p.dancerId.toString() === userId);
    const user = await this._usersService.findById(
      currentParticipant?.dancerId.toString() ?? '',
    );

    // Handle Instructor ID extraction safely
    let instructorId: string | Types.ObjectId;
    if (workshop.instructor instanceof Types.ObjectId) {
      instructorId = workshop.instructor;
    } else {
      // Assuming populated
      instructorId = (
        workshop.instructor as unknown as User & { _id: Types.ObjectId }
      )._id;
    }

    await this.notificationService.createNotification(
      instructorId,
      NotificationType.WORKSHOP_BOOKING_RECEIVED,
      'New Workshop Booking',
      `You have a new booking from 
            ${user?.username}
for your workshop: ${workshop.title} `,
    );

    return {
      success: true,
      message: 'Successfully registered for workshop',
      workshop,
    };
  }

  async getBookedWorkshops(
    userId: string,
    options: {
      search?: string;
      style?: string;
      sortBy?: string;
      page?: string;
      limit?: string;
    },
  ): Promise<PaginatedBookedWorkshops> {
    // {
    //   workshops: Workshop[];
    //   total: number;
    //   page: number;
    //   limit: number;
    //   totalPages: number;
    // }
    // Parse pagination in service layer
    const page = options.page ? parseInt(options.page, 10) : 1;
    const limit = options.limit ? parseInt(options.limit, 10) : 10;
    const { search, style, sortBy } = options;

    const query: FilterQuery<Workshop> = {
      'participants.dancerId': new Types.ObjectId(userId),
    };

    // Build the aggregation pipeline
    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructor',
        },
      },
      { $unwind: '$instructor' },
      {
        $addFields: {
          userParticipant: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$participants',
                  as: 'p',
                  cond: { $eq: ['$$p.dancerId', new Types.ObjectId(userId)] },
                },
              },
              0,
            ],
          },
        },
      },
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { 'instructor.username': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    // Style filter
    if (style) {
      pipeline.push({
        $match: { style: { $regex: style, $options: 'i' } },
      });
    }

    // Sorting
    let sortStage: Record<string, 1 | -1> = { startDate: -1 }; // Default sort by date descending
    if (sortBy === 'fee') {
      sortStage = { fee: 1 };
    } else if (sortBy === 'date') {
      sortStage = { startDate: -1 };
    } else if (sortBy === 'paymentStatus') {
      sortStage = { 'userParticipant.paymentStatus': 1 };
    }
    pipeline.push({ $sort: sortStage });

    // Count total before pagination
    const countPipeline = [...pipeline]; // Copy pipeline for counting

    const total =
      await this._workshopRepository.countBookedWorkshops(countPipeline);

    // Pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    const workshops = await this._workshopRepository.findBookedWorkshops(
      userId,
      pipeline,
    );
    console.log('workshops in service', workshops);

    // Add signed URLs
    const workshopsWithUrls = await Promise.all(
      workshops.map(async (workshop) => {
        return this.addSignedUrlsToWorkshop(workshop);
      }),
    );

    return {
      workshops: workshopsWithUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async addSignedUrlsToWorkshop(
    workshop: WorkshopDocument | Workshop,
  ): Promise<Workshop> {
    if (workshop.posterImage) {
      workshop.posterImage = await StorageUtils.getSignedUrl(
        this.awsS3Service,
        workshop.posterImage,
      );
    }
    // Type Guard for Populated Instructor
    const isInstructorPopulated = (
      instructor: unknown,
    ): instructor is { profileImage: string } => {
      return (
        !!instructor &&
        typeof instructor === 'object' &&
        'profileImage' in instructor
      );
    };

    if (workshop.instructor && isInstructorPopulated(workshop.instructor)) {
      workshop.instructor.profileImage = await StorageUtils.getSignedUrl(
        this.awsS3Service,
        workshop.instructor.profileImage,
      );
    }
    return workshop;
  }

  async initiateWorkshopBooking(
    workshopId: string,
    userId: string,
  ): Promise<PaymentInitiationResponse> {
    const workshop = await this._workshopRepository.findById(workshopId);

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Cast participants to safe type
    const participants = (workshop.participants ||
      []) as unknown as WorkshopParticipant[];

    // Check if workshop is full
    if (participants.length >= workshop.maxParticipants) {
      throw new BadRequestException('Workshop is full');
    }

    // Check if user already registered with paid status
    const existingParticipant = participants?.find(
      (p) => p.dancerId.toString() === userId,
    );

    if (existingParticipant && existingParticipant.paymentStatus === 'paid') {
      throw new BadRequestException(
        'You are already registered for this workshop',
      );
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(workshop.deadline)) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Create Razorpay Order
    try {
      const order = await this.razorpayService.createOrder(
        workshop.fee,
        'INR',
        `ws_${workshopId.slice(-6)}_${Date.now()} `,
      );
      console.log('order in workshop service', order);
      return {
        workshop,
        amount: workshop.fee,
        currency: 'INR',
        orderId: order.id,
      };
    } catch (error) {
      console.error('Razorpay Order Creation Failed:', error);
      throw new BadRequestException('Failed to initiate payment order');
    }
  }

  async markPaymentFailed(workshopId: string, userId: string): Promise<void> {
    const workshop = await this._workshopRepository.findById(workshopId);

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (!workshop.participants) {
      workshop.participants = [];
    }

    const participants =
      workshop.participants as unknown as WorkshopParticipant[];

    // Find if user already has a participant entry
    const participantIndex = participants?.findIndex(
      (p) => p.dancerId.toString() === userId,
    );

    if (participantIndex !== undefined && participantIndex !== -1) {
      // Update existing participant status to failed
      workshop.participants[participantIndex].paymentStatus = 'failed';
    } else {
      const newParticipant: WorkshopParticipant = {
        dancerId: new Types.ObjectId(userId),
        paymentStatus: 'failed',
        attendance: false,
        registeredAt: new Date(),
      };
      (workshop.participants as unknown as WorkshopParticipant[]).push(
        newParticipant,
      );
      // Add new participant with failed status
      // if (!workshop.participants) {
      //   workshop.participants = [];
      // }
      // workshop.participants.push({
      //   dancerId: new Types.ObjectId(userId),
      //   paymentStatus: 'failed',
      //   attendance: false,
      //   registeredAt: new Date(),
      // });
    }
    console.log('workshop in markPaymentFailed', workshop);
    await this._workshopRepository.save(workshop);

    // Record failed payment
    await this.paymentsService.createRecord({
      userId,
      amount: workshop.fee,
      paymentType: PaymentType.WORKSHOP,
      status: PaymentStatus.FAILED,
      referenceId: workshopId,
      description: `Failed registration for workshop: ${workshop.title} `,
    });
  }
}
