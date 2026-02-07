import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types, FilterQuery, SortOrder, PipelineStage } from 'mongoose';
import { CompetitionRepository } from '../repositories/competition.repository';
import { CompetitionDocument } from '../models/competition.schema';
import {
  CreateCompetitionDto,
  PopulatedUser,
  RegisteredDancerItem,
} from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { Competition, CompetitionStatus } from '../models/competition.schema';
import {
  type ICompetitionRepo,
  ICompetitionRepoToken,
} from '../interfaces/competition.repo.interface';
import { ICompetitionService } from '../interfaces/competition.service.interface';
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
} from '../../payments/interfaces/payments.service.interface';
import type { IPaymentsService } from '../../payments/interfaces/payments.service.interface';
import { StorageUtils } from 'src/common/storage/utils/storage.utils';
import { NotificationService } from 'src/modules/notifications/services/notification.service';
import {
  type INotificationService,
  INotificationServiceToken,
} from 'src/modules/notifications/interfaces/notifications.service.interface';
import {
  type IUserService,
  IUserServiceToken,
} from 'src/modules/users/interfaces/user.service.interface';
import { NotificationType } from 'src/common/enums/notification-type.enum';

@Injectable()
export class CompetitionService implements ICompetitionService {
  constructor(
    @Inject(ICompetitionRepoToken)
    private readonly _competitionRepository: ICompetitionRepo,
    @Inject(IStorageServiceToken)
    private readonly _storageService: IStorageService,
    @Inject(IPaymentServiceToken)
    private readonly _paymentService: IPaymentService,
    @Inject(IPaymentsServiceToken)
    private readonly _paymentsService: IPaymentsService,
    @Inject(INotificationServiceToken)
    private readonly notificationService: INotificationService,
    @Inject(IUserServiceToken) private readonly _usersService: IUserService,
  ) { }

  async create(
    body: CreateCompetitionDto,
    organizerId: string,
    posterFile?: Express.Multer.File,
    documentFile?: Express.Multer.File,
  ): Promise<Competition> {
    // Map DTO in service layer
    const createCompetitionDto: CreateCompetitionDto = {
      title: body.title,
      description: body.description,
      category: body.category,
      style: body.style,
      level: body.level,
      age_category: body.age_category,
      mode: body.mode,
      duration: body.duration,
      location: body.location,
      meeting_link: body.meeting_link,
      posterImage: body.posterImage || '',
      fee: Number(body.fee),
      date: body.date,
      registrationDeadline: body.registrationDeadline,
      maxParticipants: Number(body.maxParticipants),
    };

    let posterImage = createCompetitionDto.posterImage;
    let documentUrl = '';

    // Upload file to S3 if provided
    if (posterFile && posterFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const sanitizedName = posterFile.originalname.replace(/\s+/g, '-');
      const fileName = `competitions/${uniqueSuffix}-${sanitizedName}`;
      const uploadResult = await this._storageService.uploadBuffer(
        posterFile.buffer,
        fileName,
        posterFile.mimetype,
      );
      posterImage = uploadResult.Location;
      // console.log('Competition image uploaded to S3:', posterImage);
    }

    // Upload document to S3 if provided
    if (documentFile && documentFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const sanitizedName = documentFile.originalname.replace(/\s+/g, '-');
      const fileName = `competitions/documents/${uniqueSuffix}-${sanitizedName}`;
      const uploadResult = await this._storageService.uploadBuffer(
        documentFile.buffer,
        fileName,
        documentFile.mimetype,
      );
      documentUrl = uploadResult.Location;
      // console.log('Competition document uploaded to S3:', documentUrl);
    }
    const competitionData = {
      ...createCompetitionDto,
      posterImage,
      document: documentUrl || undefined,
      organizer_id: new Types.ObjectId(organizerId),
      date: new Date(createCompetitionDto.date),
      registrationDeadline: new Date(createCompetitionDto.registrationDeadline),
    };
    const createdCompetition =
      await this._competitionRepository.create(competitionData);

    // Convert to plain object and add signed URLs
    const competitionObj = (createdCompetition as CompetitionDocument).toObject
      ? (createdCompetition as CompetitionDocument).toObject()
      : createdCompetition;
    return this.addSignedUrlsToCompetition(competitionObj);
  }

  async findAll(options?: {
    search?: string;
    sortBy?: string;
    level?: string;
    style?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Competition[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: FilterQuery<Competition> = {};

    if (options?.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.style) {
      query.style = options.style;
    }

    if (options?.level) {
      query.level = options.level;
    }

    // Handle status filtering
    if (options?.status === 'upcoming') {
      query.status = CompetitionStatus.ACTIVE;
      query.date = { $gte: new Date() };
    } else if (options?.status) {
      query.status = options.status;
    }

    let sortOptions: Record<string, SortOrder> = { createdAt: -1 }; // Default sort
    if (options?.sortBy) {
      if (options.sortBy === 'popularity') {
        sortOptions = { participantsCount: -1 };
      } else {
        const [field, order] = options.sortBy.split(':');
        if (['fee', 'date', 'popularity'].includes(field)) {
          sortOptions = {
            [field === 'popularity' ? 'participantsCount' : field]:
              order === 'desc' ? -1 : 1,
          };
        }
      }
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const { data, total } = await this._competitionRepository.find(
      query,
      sortOptions,
      skip,
      limit,
    );
    const competitionsWithSignedUrls =
      await this.processCompetitionsWithUrls(data);

    return {
      data: competitionsWithSignedUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Competition> {
    const competition = await this._competitionRepository.findByIdPublic(id);
    if (!competition) {
      throw new Error('Competition not found');
    }

    // Convert to plain object if needed and add signed URLs
    const competitionObj = (competition as CompetitionDocument).toObject
      ? (competition as CompetitionDocument).toObject()
      : competition;
    return this.addSignedUrlsToCompetition(competitionObj);
  }

  async findByOrganizer(
    organizerId: string,
    options?: {
      search?: string;
      sortBy?: string;
      level?: string;
      style?: string;
      category?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: Competition[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const query: FilterQuery<Competition> = {};
    if (options?.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }
    if (options?.category) query.category = options.category;
    if (options?.style) query.style = options.style;
    if (options?.level) query.level = options.level;

    let sortOptions: Record<string, SortOrder> = { createdAt: -1 };
    if (options?.sortBy) {
      const [field, order] = options.sortBy.split(':');
      if (['fee', 'date'].includes(field)) {
        sortOptions = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const { data, total } = await this._competitionRepository.findByOrganizer(
      organizerId,
      query,
      sortOptions,
      skip,
      limit,
    );
    const competitionsWithSignedUrls =
      await this.processCompetitionsWithUrls(data);

    return {
      data: competitionsWithSignedUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async processCompetitionsWithUrls(
    competitions: Competition[],
  ): Promise<Competition[]> {
    const competitionsWithSignedUrls = await Promise.all(
      competitions.map(async (competition) => {
        const competitionObj = (competition as CompetitionDocument).toObject
          ? (competition as CompetitionDocument).toObject()
          : competition;
        return this.addSignedUrlsToCompetition(competitionObj);
      }),
    );
    return competitionsWithSignedUrls;
  }

  private async addSignedUrlsToCompetition(
    competition: CompetitionDocument | Competition,
  ): Promise<Competition> {
    const promises: Promise<void>[] = [];

    // Handle poster image
    if (competition.posterImage) {
      promises.push(
        StorageUtils.getSignedUrl(
          this._storageService,
          competition.posterImage,
        ).then((url) => {
          competition.posterImage = url;
        }),
      );
    }

    // Handle organizer profile image if populated
    const organizer = competition.organizer_id as unknown as PopulatedUser;
    if (
      organizer &&
      typeof organizer === 'object' &&
      'profileImage' in organizer &&
      organizer.profileImage
    ) {
      promises.push(
        StorageUtils.getSignedUrl(
          this._storageService,
          organizer.profileImage,
        ).then((url) => {
          organizer.profileImage = url;
        }),
      );
    }

    // Handle document if exists
    if (competition.document) {
      promises.push(
        StorageUtils.getSignedUrl(
          this._storageService,
          competition.document,
        ).then((url) => {
          competition.document = url;
        }),
      );
    }

    // Handle registered dancers' profile images if populated
    if (
      competition.registeredDancers &&
      Array.isArray(competition.registeredDancers) &&
      competition.registeredDancers.length > 0
    ) {
      // Only process if dancers are populated and present (skipped in list view)
      promises.push(
        Promise.all(
          competition.registeredDancers.map(async (dancer) => {
            const typedDancer = dancer as unknown as RegisteredDancerItem;
            if (
              typedDancer.dancerId &&
              typeof typedDancer.dancerId === 'object' &&
              'profileImage' in typedDancer.dancerId
            ) {
              const dancerObj = typedDancer.dancerId;
              if (dancerObj.profileImage) {
                dancerObj.profileImage = await StorageUtils.getSignedUrl(
                  this._storageService,
                  dancerObj.profileImage,
                );
              }
            }
            return dancer;
          }),
        ).then(() => { }),
      );
    }

    await Promise.all(promises);
    return competition;
  }

  async findActiveCompetitions(): Promise<Competition[]> {
    return this._competitionRepository.findActiveCompetitions();
  }

  async findByCategory(category: string): Promise<Competition[]> {
    return this._competitionRepository.findByCategory(category);
  }

  async findByStyle(style: string): Promise<Competition[]> {
    return this._competitionRepository.findByStyle(style);
  }

  async update(
    id: string,
    body: UpdateCompetitionDto,
    posterFile?: Express.Multer.File,
    documentFile?: Express.Multer.File,
  ): Promise<Competition> {
    // Map DTO in service layer
    // const updateCompetitionDto: Partial<CreateCompetitionDto> = {
    //   title: body.title,
    //   description: body.description,
    //   category: body.category,
    //   style: body.style,
    //   level: body.level,
    //   age_category: body.age_category,
    //   mode: body.mode,
    //   duration: body.duration,
    //   location: body.location,
    //   meeting_link: body.meeting_link,
    //   posterImage: body.posterImage || '',
    //   fee: body.fee ? Number(body.fee) : undefined,
    //   date: body.date,
    //   registrationDeadline: body.registrationDeadline,
    //   maxParticipants: body.maxParticipants
    //     ? Number(body.maxParticipants)
    //     : undefined,
    // };

    // Remove undefined values
    // Object.keys(updateCompetitionDto).forEach(
    //   (key) =>
    //     updateCompetitionDto[key] === undefined &&
    //     delete updateCompetitionDto[key],
    // );

    let posterImage = body.posterImage;
    let documentUrl = body.document;

    // Upload file to S3 if a new file is provided
    if (posterFile && posterFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/${uniqueSuffix}-${posterFile.originalname}`;
      const uploadResult = await this._storageService.uploadBuffer(
        posterFile.buffer,
        fileName,
        posterFile.mimetype,
      );
      posterImage = uploadResult.Location;
      console.log('Competition image updated to S3:', posterImage);
    }
    // Upload new document to S3 if provided
    if (documentFile && documentFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/documents/${uniqueSuffix}-${documentFile.originalname}`;
      const uploadResult = await this._storageService.uploadBuffer(
        documentFile.buffer,
        fileName,
        documentFile.mimetype,
      );
      documentUrl = uploadResult.Location;
      console.log('Competition document updated to S3:', documentUrl);
    }

    const formattedDate = body.date ? new Date(body.date) : undefined;
    const formattedDeadline = body.registrationDeadline
      ? new Date(body.registrationDeadline)
      : undefined;

    const updateData: Partial<Competition> = {
      title: body.title,
      description: body.description,
      category: body.category,
      style: body.style,
      level: body.level,
      age_category: body.age_category,
      mode: body.mode,
      duration: body.duration,
      location: body.location,
      meeting_link: body.meeting_link,
      posterImage: posterImage,
      document: documentUrl,
      fee: body.fee ? Number(body.fee) : undefined,
      maxParticipants: body.maxParticipants
        ? Number(body.maxParticipants)
        : undefined,
      // Assign the converted Date objects here
      date: formattedDate,
      registrationDeadline: formattedDeadline,
    };
    // const updateData: Record<string, unknown> = { ...updateCompetitionDto };
    // const updateData: Partial<Competition> & { posterImage?: string; document?: string } = {
    //   ...updateCompetitionDto,
    //   date: formattedDate,
    //   registrationDeadline: formattedDeadline,
    // };
    //iterate over the keys and delete keys that are undefined
    Object.keys(updateData).forEach((key) => {
      // Cast key to keyof Competition to satisfy TypeScript
      const k = key as keyof Competition;
      if (updateData[k] === undefined) {
        delete updateData[k];
      }
    });

    // Update posterImage if a new one was uploaded or provided
    // if (posterImage) {
    //   updateData.posterImage = posterImage;
    // }
    // Update document if a new one was uploaded or provided
    // if (documentUrl) {
    //   updateData.document = documentUrl;
    // }

    // console.log('Update Service - Poster Image:', posterImage);
    // console.log('Update Service - Document URL:', documentUrl);
    // console.log('Update Service - Update Data:', updateData);

    // Convert date strings to Date objects if provided
    // if (updateData.date) {
    //   updateData.date = new Date(updateData.date);
    // }
    // if (updateData.registrationDeadline) {
    //   updateData.registrationDeadline = new Date(
    //     updateData.registrationDeadline,
    //   );
    // }

    const competition = await this._competitionRepository.update(
      id,
      updateData,
    );
    // console.log('Update Service - Competition:', competition);
    if (!competition) {
      throw new Error('Competition not found');
    }

    // Convert to plain object and add signed URLs
    const competitionObj = (competition as CompetitionDocument).toObject
      ? (competition as CompetitionDocument).toObject()
      : competition;
    return this.addSignedUrlsToCompetition(competitionObj);
  }

  async remove(id: string): Promise<void> {
    await this._competitionRepository.delete(id);
  }

  async registerDancer(
    competitionId: string,
    dancerId: string,
    paymentStatus: string = 'pending',
  ): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    // Check if dancer is already registered
    const isAlreadyRegistered = competition.registeredDancers.some(
      (dancer) => dancer.dancerId.toString() === dancerId,
    );

    if (isAlreadyRegistered) {
      throw new Error('Dancer is already registered for this competition');
    }

    // Add dancer to registered list
    competition.registeredDancers.push({
      dancerId: new Types.ObjectId(dancerId),
      paymentStatus,
      score: 0,
      registeredAt: new Date(),
    });

    const updatedCompetition = await this._competitionRepository.update(
      competitionId,
      competition,
    );
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async updatePaymentStatus(
    competitionId: string,
    dancerId: string,
    paymentStatus: string,
  ): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    const dancerIndex = competition.registeredDancers.findIndex(
      (dancer) => dancer.dancerId.toString() === dancerId,
    );

    if (dancerIndex === -1) {
      throw new Error('Dancer not registered for this competition');
    }

    competition.registeredDancers[dancerIndex].paymentStatus = paymentStatus;
    const updatedCompetition = await this._competitionRepository.update(
      competitionId,
      competition,
    );
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async updateScore(
    competitionId: string,
    dancerId: string,
    score: number,
  ): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    const dancerIndex = competition.registeredDancers.findIndex(
      (dancer) => dancer.dancerId.toString() === dancerId,
    );

    if (dancerIndex === -1) {
      throw new Error('Dancer not registered for this competition');
    }

    competition.registeredDancers[dancerIndex].score = score;
    const updatedCompetition = await this._competitionRepository.update(
      competitionId,
      competition,
    );
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async finalizeResults(
    competitionId: string,
    results: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<Competition> {
    const updatedCompetition = await this._competitionRepository.update(
      competitionId,
      {
        results,
        status: CompetitionStatus.COMPLETED,
      },
    );
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async findRegisteredCompetitions(
    dancerId: string,
    options?: {
      search?: string;
      sortBy?: string;
      level?: string;
      style?: string;
      category?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: Competition[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const query: FilterQuery<Competition> = {};
    if (options?.search) {
      query.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }
    if (options?.category) query.category = options.category;
    if (options?.style) query.style = options.style;
    if (options?.level) query.level = options.level;

    let sortOptions: Record<string, SortOrder> = { createdAt: -1 };
    if (options?.sortBy) {
      const [field, order] = options.sortBy.split(':');
      if (['fee', 'date'].includes(field)) {
        sortOptions = { [field]: order === 'desc' ? -1 : 1 };
      }
    }

    const { data, total } =
      await this._competitionRepository.findRegisteredCompetitions(
        dancerId,
        query,
        sortOptions,
        skip,
        limit,
      );
    const competitionsWithSignedUrls =
      await this.processCompetitionsWithUrls(data);
    return {
      data: competitionsWithSignedUrls,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
  async initiatePayment(
    competitionId: string,
    dancerId: string,
    amount: number,
    currency: string,
  ) {
    const competition =
      await this._competitionRepository.findById(competitionId);

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Check if workshop is full
    if (
      competition.registeredDancers &&
      competition.registeredDancers.length >= competition.maxParticipants
    ) {
      throw new BadRequestException('Competition is full');
    }

    // Check if user already registered with paid status
    const existingParticipant = competition.registeredDancers?.find(
      (p: { dancerId: Types.ObjectId | string }) =>
        p.dancerId.toString() === dancerId,
    );

    if (existingParticipant && existingParticipant.paymentStatus === 'paid') {
      throw new BadRequestException(
        'You are already registered for this workshop',
      );
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(competition.registrationDeadline)) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Create Razorpay Order
    try {
      const order = await this._paymentService.createOrder(
        competition.fee,
        'INR',
        `ws_${competitionId.slice(-6)}_${Date.now()}`,
      );
      console.log('order in competition service', order);
      return {
        competition,
        amount: competition.fee,
        currency: 'INR',
        orderId: order.id,
      };
    } catch (error) {
      console.error('Razorpay Order Creation Failed:', error);
      throw new BadRequestException('Failed to initiate payment order');
    }
  }

  async confirmPayment(
    competitionId: string,
    dancerId: string,
    paymentId: string,
    orderId: string,
    signature: string,
    amount: number,
  ) {
    const competition =
      await this._competitionRepository.findById(competitionId);

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Initialize participants array if needed
    if (!competition.registeredDancers) {
      competition.registeredDancers = [];
    }

    // Check if user already has a participant entry (e.g., from a failed payment)
    const participantIndex = competition.registeredDancers.findIndex(
      (p: { dancerId: Types.ObjectId | string }) =>
        p.dancerId.toString() === dancerId,
    );

    if (participantIndex !== -1) {
      // Update existing participant's payment status to 'paid'
      competition.registeredDancers[participantIndex].paymentStatus = 'paid';
      competition.registeredDancers[participantIndex].registeredAt = new Date();
    } else {
      // Add new participant entry
      competition.registeredDancers.push({
        dancerId: new Types.ObjectId(dancerId),
        paymentStatus: 'paid',
        attendance: false,
        score: 0,
        registeredAt: new Date(),
      });
      competition.participantsCount = (competition.participantsCount || 0) + 1;
    }

    await this._competitionRepository.update(competitionId, competition);

    // Record payment history
    await this._paymentsService.createRecord({
      userId: dancerId,
      amount: competition.fee,
      paymentType: PaymentType.COMPETITION,
      status: PaymentStatus.SUCCESS,
      referenceId: competitionId,
      transactionId: paymentId,
      orderId: orderId,
      description: `Registration for competition: ${competition.title}`,
    });

    // Send confirmation email
    // Get user details for notification
    const user = await this._usersService.findById(dancerId);

    let organizerId: Types.ObjectId;

    if (competition.organizer_id instanceof Types.ObjectId) {
      organizerId = competition.organizer_id;
    } else {
      // It is a populated document, so we access _id
      const organizer = competition.organizer_id as unknown as PopulatedUser;
      organizerId = organizer._id;
    }

    // Send confirmation notification to organizer
    await this.notificationService.createNotification(
      organizerId,
      // competition.organizer_id instanceof Types.ObjectId
      //   ? competition.organizer_id
      //   : (competition.organizer_id )._id,
      NotificationType.COMPETITION_BOOKING_RECEIVED,
      'New Competition Booking',
      `You have a new booking from ${user?.username || 'a user'} for your competition: ${competition.title}`,
    );

    return {
      success: true,
      message: 'Successfully registered for competition',
      competition,
    };
  }

  async markPaymentFailed(
    competitionId: string,
    userId: string,
  ): Promise<void> {
    const competition =
      await this._competitionRepository.findById(competitionId);

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Find if user already has a participant entry
    const participantIndex = competition.registeredDancers?.findIndex(
      (p: { dancerId: Types.ObjectId | string }) =>
        p.dancerId.toString() === userId,
    );

    if (participantIndex !== undefined && participantIndex !== -1) {
      // Update existing participant status to failed
      competition.registeredDancers[participantIndex].paymentStatus = 'failed';
    } else {
      // Add new participant with failed status
      if (!competition.registeredDancers) {
        competition.registeredDancers = [];
      }
      competition.registeredDancers.push({
        dancerId: new Types.ObjectId(userId),
        paymentStatus: 'failed',
        attendance: false,
        score: 0,
        registeredAt: new Date(),
      });
    }
    // console.log('competition in markPaymentFailed', competition);
    await this._competitionRepository.update(competitionId, competition);

    // Record failed payment
    await this._paymentsService.createRecord({
      userId,
      amount: competition.fee,
      paymentType: PaymentType.COMPETITION,
      status: PaymentStatus.FAILED,
      referenceId: competitionId,
      description: `Failed registration for competition: ${competition.title}`,
    });
  }
}
