import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workshop, WorkshopDocument } from './models/workshop.schema';
import { CreateWorkshopDto } from './dto/workshop.dto';
import { AwsS3Service } from '../../common/storage/aws-s3.service';
import { WorkshopsRepository } from './repositories/workshops.repository';

import { RazorpayService } from '../../common/payments/razorpay/razorpay.service';

@Injectable()
export class WorkshopsService {
    constructor(
        @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>,
        private readonly awsS3Service: AwsS3Service,
        private readonly workshopsRepository: WorkshopsRepository,
        private readonly razorpayService: RazorpayService
    ) { }

    async create(createWorkshopDto: CreateWorkshopDto, file: any, instructorId: string): Promise<Workshop> {
        console.log("Creating workshop with instructorId:", instructorId);
        console.log("Workshop data:", createWorkshopDto);

        let posterImage = createWorkshopDto.posterImage;

        // Upload file to S3 if provided
        if (file && file.buffer) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `workshops/${uniqueSuffix}-${file.originalname}`;
            const uploadResult = await this.awsS3Service.uploadBuffer(file.buffer, fileName, file.mimetype);
            posterImage = uploadResult.Location;
            console.log("Image uploaded to S3:", posterImage);
        }

        const newWorkshop = new this.workshopModel({
            ...createWorkshopDto,
            posterImage,
            instructor: new Types.ObjectId(instructorId),
        });

        const savedWorkshop = await newWorkshop.save();
        console.log("Workshop created successfully:", {
            id: savedWorkshop._id,
            title: savedWorkshop.title,
            instructor: savedWorkshop.instructor
        });

        return savedWorkshop;
    }

    async findAll(query: any): Promise<{ workshops: Workshop[], total: number, page: number, limit: number }> {
        return this.workshopsRepository.findAllWithFilters(query);
    }

    async findOne(id: string): Promise<Workshop> {
        const workshop = await this.workshopModel.findById(id).populate('instructor', 'username profileImage').exec();
        if (!workshop) {
            throw new NotFoundException(`Workshop with ID ${id} not found`);
        }
        return workshop;
    }

    async update(id: string, updateWorkshopDto: any, file: any): Promise<Workshop> {
        let updateData = { ...updateWorkshopDto };

        // Parse sessions if it's a string (from FormData)
        if (updateData.sessions && typeof updateData.sessions === 'string') {
            try {
                updateData.sessions = JSON.parse(updateData.sessions);
            } catch (error) {
                console.error('Failed to parse sessions:', error);
                throw new BadRequestException('Invalid sessions format');
            }
        }

        // Parse participants if it's a string (from FormData)
        if (updateData.participants && typeof updateData.participants === 'string') {
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
            const fileName = `workshops/${uniqueSuffix}-${file.originalname}`;
            const uploadResult = await this.awsS3Service.uploadBuffer(file.buffer, fileName, file.mimetype);
            updateData.posterImage = uploadResult.Location;
        }

        const updatedWorkshop = await this.workshopModel.
            findByIdAndUpdate(id, updateData, { new: true })
            .populate('instructor', 'username profileImage')
            .exec();

        if (!updatedWorkshop) {
            throw new NotFoundException(`Workshop with ID ${id} not found`);
        }
        return updatedWorkshop;
    }

    async remove(id: string): Promise<void> {
        const result = await this.workshopModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Workshop with ID ${id} not found`);
        }
    }

    async getInstructorWorkshops(instructorId: string): Promise<Workshop[]> {
        // Convert string to ObjectId for querying
        const workshops = await this.workshopModel.find({
            instructor: new Types.ObjectId(instructorId)
        }).exec();
        return workshops;
    }

    async confirmWorkshopBooking(
        workshopId: string,
        userId: string,
        paymentId: string,
        orderId: string,
        signature: string
    ) {
        const workshop = await this.workshopModel.findById(workshopId).exec();

        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Initialize participants array if needed
        if (!workshop.participants) {
            workshop.participants = [];
        }

        // Check if user already has a participant entry (e.g., from a failed payment)
        const participantIndex = workshop.participants.findIndex(
            (p: any) => p.dancerId.toString() === userId
        );

        if (participantIndex !== -1) {
            // Update existing participant's payment status to 'paid'
            workshop.participants[participantIndex].paymentStatus = 'paid';
            workshop.participants[participantIndex].registeredAt = new Date();
        } else {
            // Add new participant entry
            workshop.participants.push({
                dancerId: new Types.ObjectId(userId),
                paymentStatus: 'paid',
                attendance: false,
                registeredAt: new Date()
            } as any);
        }

        await workshop.save();

        // TODO: Create a booking record in a separate Bookings collection if needed
        // TODO: Send confirmation email

        return {
            success: true,
            message: 'Successfully registered for workshop',
            workshop
        };
    }

    async getBookedWorkshops(
        userId: string,
        search?: string,
        style?: string,
        sortBy?: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ workshops: Workshop[], total: number, page: number, limit: number, totalPages: number }> {
        const query: any = { 'participants.dancerId': new Types.ObjectId(userId) };

        // Build the aggregation pipeline
        const pipeline: any[] = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'instructor',
                    foreignField: '_id',
                    as: 'instructor'
                }
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
                                    cond: { $eq: ['$$p.dancerId', new Types.ObjectId(userId)] }
                                }
                            },
                            0
                        ]
                    }
                }
            }
        ];

        // Search filter
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { 'instructor.username': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Style filter
        if (style) {
            pipeline.push({
                $match: { style: { $regex: style, $options: 'i' } }
            });
        }

        // Sorting
        let sortStage: any = { startDate: -1 }; // Default sort by date descending
        if (sortBy === 'fee') {
            sortStage = { fee: 1 };
        } else if (sortBy === 'date') {
            sortStage = { startDate: -1 };
        } else if (sortBy === 'paymentStatus') {
            sortStage = { 'userParticipant.paymentStatus': 1 };
        }
        pipeline.push({ $sort: sortStage });

        // Count total before pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await this.workshopModel.aggregate(countPipeline).exec();
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Pagination
        const skip = (page - 1) * limit;
        pipeline.push({ $skip: skip }, { $limit: limit });

        // Execute aggregation
        const workshops = await this.workshopModel.aggregate(pipeline).exec();
        console.log("workshops in service", workshops);
        return {
            workshops,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    private async addSignedUrlsToWorkshop(workshop: any): Promise<any> {
        if (workshop.posterImage) {
            // Check if it's already a full URL or just a key
            if (workshop.posterImage.startsWith('http')) {
                // Extract the key from the URL
                const url = new URL(workshop.posterImage);
                const key = url.pathname.substring(1); // Remove leading '/'
                workshop.posterImage = this.awsS3Service.getSignedUrl(key);
            } else {
                workshop.posterImage = this.awsS3Service.getSignedUrl(workshop.posterImage);
            }
        }
        if (workshop.instructor?.profileImage) {
            if (workshop.instructor.profileImage.startsWith('http')) {
                const url = new URL(workshop.instructor.profileImage);
                const key = url.pathname.substring(1);
                workshop.instructor.profileImage = this.awsS3Service.getSignedUrl(key);
            } else {
                workshop.instructor.profileImage = this.awsS3Service.getSignedUrl(workshop.instructor.profileImage);
            }
        }
        return workshop;
    }

    async initiateWorkshopBooking(workshopId: string, userId: string) {
        const workshop = await this.workshopModel.findById(workshopId).exec();

        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Check if workshop is full
        if (workshop.participants && workshop.participants.length >= workshop.maxParticipants) {
            throw new BadRequestException('Workshop is full');
        }

        // Check if user already registered with paid status
        const existingParticipant = workshop.participants?.find(
            (p: any) => p.dancerId.toString() === userId
        );

        if (existingParticipant && existingParticipant.paymentStatus === 'paid') {
            throw new BadRequestException('You are already registered for this workshop');
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
                `ws_${workshopId.slice(-6)}_${Date.now()}`
            );
            console.log("order in workshop service", order);
            return {
                workshop,
                amount: workshop.fee,
                currency: 'INR',
                orderId: order.id
            };
        } catch (error) {
            console.error('Razorpay Order Creation Failed:', error);
            throw new BadRequestException('Failed to initiate payment order');
        }
    }

    async markPaymentFailed(workshopId: string, userId: string): Promise<void> {
        const workshop = await this.workshopModel.findById(workshopId).exec();

        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Find if user already has a participant entry
        const participantIndex = workshop.participants?.findIndex(
            (p: any) => p.dancerId.toString() === userId
        );

        if (participantIndex !== undefined && participantIndex !== -1) {
            // Update existing participant status to failed
            workshop.participants[participantIndex].paymentStatus = 'failed';
        } else {
            // Add new participant with failed status
            if (!workshop.participants) {
                workshop.participants = [];
            }
            workshop.participants.push({
                dancerId: new Types.ObjectId(userId),
                paymentStatus: 'failed',
                attendance: false,
                registeredAt: new Date()
            } as any);
        }
        console.log("workshop in markPaymentFailed", workshop);
        await workshop.save();
    }
}
