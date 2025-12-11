import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CompetitionRepository } from '../repositories/competition.repository';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { Competition, CompetitionStatus } from '../models/competition.schema';
import { RazorpayService } from 'src/common/payments/razorpay/razorpay.service';
import { AwsS3Service } from 'src/common/storage/aws-s3.service';
import {type ICompetitionRepo, ICompetitionRepoToken } from '../interfaces/competition.repo.interface';
import { ICompetitionService } from '../interfaces/competition.service.interface';

@Injectable()
export class CompetitionService implements ICompetitionService {
  constructor(
    @Inject(ICompetitionRepoToken)
    private readonly _competitionRepository: ICompetitionRepo,
    private readonly _awsService: AwsS3Service,
    private readonly _razorpayService: RazorpayService) { }

  async create(createCompetitionDto: CreateCompetitionDto, organizerId: string, posterFile?: any, documentFile?: any): Promise<Competition> {
    let posterImage = createCompetitionDto.posterImage;
    let documentUrl = '';

    // Upload file to S3 if provided
    if (posterFile && posterFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/${uniqueSuffix}-${posterFile.originalname}`;
      const uploadResult = await this._awsService.uploadBuffer(posterFile.buffer, fileName, posterFile.mimetype);
      posterImage = uploadResult.Location;
      console.log("Competition image uploaded to S3:", posterImage);
    }

    // Upload document to S3 if provided
    if (documentFile && documentFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/documents/${uniqueSuffix}-${documentFile.originalname}`;
      const uploadResult = await this._awsService.uploadBuffer(documentFile.buffer, fileName, documentFile.mimetype);
      documentUrl = uploadResult.Location;
      console.log("Competition document uploaded to S3:", documentUrl);
    }
    const competitionData = {
      ...createCompetitionDto,
      posterImage,
      document: documentUrl || undefined,
      organizer_id: new Types.ObjectId(organizerId),
      date: new Date(createCompetitionDto.date),
      registrationDeadline: new Date(createCompetitionDto.registrationDeadline),
    };

    let competitionCreationCount = 0
    competitionCreationCount = competitionCreationCount + 1
    if (competitionCreationCount > 3) {
      throw new BadRequestException("Reached maximum competition creation limit.")
    }
    const createdCompetition = await this._competitionRepository.create(competitionData);

    // Convert to plain object and add signed URLs
    const competitionObj = createdCompetition.toObject ? createdCompetition.toObject() : createdCompetition;
    return this.addSignedUrlsToCompetition(competitionObj);
  }

  async findAll(): Promise<Competition[]> {
    return this._competitionRepository.findAll();
  }

  async findOne(id: string): Promise<Competition> {
    const competition = await this._competitionRepository.findByIdPublic(id);
    if (!competition) {
      throw new Error('Competition not found');
    }
    return competition;
  }

  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    console.log("=== findByOrganizer called ===");
    const competitions = await this._competitionRepository.findByOrganizer(organizerId);
    console.log("Raw competitions count:", competitions.length);

    if (competitions.length > 0) {
      console.log("Sample competition posterImage:", competitions[0].posterImage);
    }

    // Add signed URLs for S3 images
    const competitionsWithSignedUrls = await Promise.all(
      competitions.map(async (competition) => {
        const competitionObj = competition.toObject ? competition.toObject() : competition;
        return this.addSignedUrlsToCompetition(competitionObj);
      })
    );

    if (competitionsWithSignedUrls.length > 0) {
      console.log("After signed URL - posterImage:", competitionsWithSignedUrls[0].posterImage);
    }

    return competitionsWithSignedUrls as Competition[];
  }

  private async addSignedUrlsToCompetition(competition: any): Promise<any> {
    console.log("=== addSignedUrlsToCompetition called ===");
    console.log("Input posterImage:", competition.posterImage);

    if (competition.posterImage) {
      // Check if it's already a full URL or just a key
      if (competition.posterImage.startsWith('http')) {
        // Extract the key from the URL
        const url = new URL(competition.posterImage);
        const key = url.pathname.substring(1); // Remove leading '/'
        console.log("Extracted key from URL:", key);
        competition.posterImage = this._awsService.getSignedUrl(key);
      } else {
        console.log("Using posterImage as key:", competition.posterImage);
        competition.posterImage = this._awsService.getSignedUrl(competition.posterImage);
      }
      console.log("Generated signed URL:", competition.posterImage);
    } else {
      console.log("No posterImage found");
    }

    // Handle organizer profile image if populated
    if (competition.organizer_id?.profileImage) {
      if (competition.organizer_id.profileImage.startsWith('http')) {
        const url = new URL(competition.organizer_id.profileImage);
        const key = url.pathname.substring(1);
        competition.organizer_id.profileImage = this._awsService.getSignedUrl(key);
      } else {
        competition.organizer_id.profileImage = this._awsService.getSignedUrl(competition.organizer_id.profileImage);
      }
    }

    // Handle document if populated
    if (competition.document) {
      console.log("Found document field:", competition.document);
      if (competition.document.startsWith('http')) {
        const url = new URL(competition.document);
        const key = url.pathname.substring(1);
        competition.document = this._awsService.getSignedUrl(key);
      } else {
        competition.document = this._awsService.getSignedUrl(competition.document);
      }
      console.log("Generated signed URL for document:", competition.document);
    } else {
      console.log("No document field found in object");
    }

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

  async update(id: string, updateCompetitionDto: UpdateCompetitionDto, posterFile?: any, documentFile?: any): Promise<Competition> {
    let posterImage = updateCompetitionDto.posterImage;
    let documentUrl = updateCompetitionDto.document;

    // Upload file to S3 if a new file is provided
    if (posterFile && posterFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/${uniqueSuffix}-${posterFile.originalname}`;
      const uploadResult = await this._awsService.uploadBuffer(posterFile.buffer, fileName, posterFile.mimetype);
      posterImage = uploadResult.Location;
      console.log("Competition image updated to S3:", posterImage);
    }
    // Upload new document to S3 if provided
    if (documentFile && documentFile.buffer) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `competitions/documents/${uniqueSuffix}-${documentFile.originalname}`;
      const uploadResult = await this._awsService.uploadBuffer(documentFile.buffer, fileName, documentFile.mimetype);
      documentUrl = uploadResult.Location;
      console.log("Competition document updated to S3:", documentUrl);
    }
    const updateData: any = { ...updateCompetitionDto };

    // Update posterImage if a new one was uploaded or provided
    if (posterImage) {
      updateData.posterImage = posterImage;
    }
    // Update document if a new one was uploaded or provided
    if (documentUrl) {
      updateData.document = documentUrl;
    }

    console.log("Update Service - Poster Image:", posterImage);
    console.log("Update Service - Document URL:", documentUrl);
    console.log("Update Service - Update Data:", updateData);

    // Convert date strings to Date objects if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
    }

    const competition = await this._competitionRepository.update(id, updateData);
    console.log("Update Service - Competition:", competition);
    if (!competition) {
      throw new Error('Competition not found');
    }

    // Convert to plain object and add signed URLs
    const competitionObj = competition.toObject ? competition.toObject() : competition;
    return this.addSignedUrlsToCompetition(competitionObj);
  }

  async remove(id: string): Promise<void> {
    await this._competitionRepository.delete(id);
  }

  async registerDancer(competitionId: string, dancerId: string, paymentStatus: string = 'pending'): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    // Check if dancer is already registered
    const isAlreadyRegistered = competition.registeredDancers.some(
      dancer => dancer.dancerId.toString() === dancerId
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

    const updatedCompetition = await this._competitionRepository.update(competitionId, competition);
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async updatePaymentStatus(competitionId: string, dancerId: string, paymentStatus: string): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    const dancerIndex = competition.registeredDancers.findIndex(
      dancer => dancer.dancerId.toString() === dancerId
    );

    if (dancerIndex === -1) {
      throw new Error('Dancer not registered for this competition');
    }

    competition.registeredDancers[dancerIndex].paymentStatus = paymentStatus;
    const updatedCompetition = await this._competitionRepository.update(competitionId, competition);
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async updateScore(competitionId: string, dancerId: string, score: number): Promise<Competition> {
    const competition = await this.findOne(competitionId);

    const dancerIndex = competition.registeredDancers.findIndex(
      dancer => dancer.dancerId.toString() === dancerId
    );

    if (dancerIndex === -1) {
      throw new Error('Dancer not registered for this competition');
    }

    competition.registeredDancers[dancerIndex].score = score;
    const updatedCompetition = await this._competitionRepository.update(competitionId, competition);
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async finalizeResults(competitionId: string, results: any): Promise<Competition> {
    const updatedCompetition = await this._competitionRepository.update(competitionId, {
      results,
      status: CompetitionStatus.COMPLETED
    });
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async findRegisteredCompetitions(dancerId: string): Promise<Competition[]> {
    const competitions = await this._competitionRepository.findRegisteredCompetitions(dancerId);

    // Add signed URLs for S3 images
    const competitionsWithSignedUrls = await Promise.all(
      competitions.map(async (competition) => {
        const competitionObj = competition.toObject ? competition.toObject() : competition;
        return this.addSignedUrlsToCompetition(competitionObj);
      })
    );

    return competitionsWithSignedUrls as Competition[];
  }
  async initiatePayment(competitionId: string, dancerId: string, amount: number, currency: string) {
    const competition = await this._competitionRepository.findById(competitionId)

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Check if workshop is full
    if (competition.registeredDancers && competition.registeredDancers.length >= competition.maxParticipants) {
      throw new BadRequestException('Competition is full');
    }

    // Check if user already registered with paid status
    const existingParticipant = competition.registeredDancers?.find(
      (p: any) => p.dancerId.toString() === dancerId
    );

    if (existingParticipant && existingParticipant.paymentStatus === 'paid') {
      throw new BadRequestException('You are already registered for this workshop');
    }

    // Check if registration deadline has passed
    if (new Date() > new Date(competition.registrationDeadline)) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Create Razorpay Order
    try {
      const order = await this._razorpayService.createOrder(
        competition.fee,
        'INR',
        `ws_${competitionId.slice(-6)}_${Date.now()}`
      );
      console.log("order in workshop service", order);
      return {
        competition,
        amount: competition.fee,
        currency: 'INR',
        orderId: order.id
      };
    } catch (error) {
      console.error('Razorpay Order Creation Failed:', error);
      throw new BadRequestException('Failed to initiate payment order');
    }
  }

  async confirmPayment(competitionId: string, dancerId: string, paymentId: string, orderId: string, signature: string, amount: number) {
    const competition = await this._competitionRepository.findById(competitionId);

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Initialize participants array if needed
    if (!competition.registeredDancers) {
      competition.registeredDancers = [];
    }

    // Check if user already has a participant entry (e.g., from a failed payment)
    const participantIndex = competition.registeredDancers.findIndex(
      (p: any) => p.dancerId.toString() === dancerId
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
        registeredAt: new Date()
      } as any);
    }

    await this._competitionRepository.update(competitionId, competition);

    // Send confirmation email

    return {
      success: true,
      message: 'Successfully registered for competition',
      competition
    };
  }

  async markPaymentFailed(competitionId: string, userId: string): Promise<void> {
    const competition = await this._competitionRepository.findById(competitionId);

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Find if user already has a participant entry
    const participantIndex = competition.registeredDancers?.findIndex(
      (p: any) => p.dancerId.toString() === userId
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
        registeredAt: new Date()
      } as any);
    }
    console.log("competition in markPaymentFailed", competition);
    await this._competitionRepository.update(competitionId, competition);
  }
}
