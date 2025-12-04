import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CompetitionRepository } from '../repositories/competition.repository';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { Competition, CompetitionStatus } from '../models/competition.schema';
import { RazorpayService } from 'src/common/payments/razorpay/razorpay.service';
import { AwsS3Service } from 'src/common/storage/aws-s3.service';

@Injectable()
export class CompetitionService {
  constructor(
    private readonly _competitionRepository: CompetitionRepository,
    private readonly _awsService: AwsS3Service,
    private readonly _razorpayService: RazorpayService) { }

  async create(createCompetitionDto: CreateCompetitionDto, organizerId: string): Promise<Competition> {
    const competitionData = {
      ...createCompetitionDto,
      organizer_id: new Types.ObjectId(organizerId),
      date: new Date(createCompetitionDto.date),
      registrationDeadline: new Date(createCompetitionDto.registrationDeadline),
    };
    console.log("ith comp service, competitionData : ", competitionData)
    return this._competitionRepository.create(competitionData);
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
    return this._competitionRepository.findByOrganizer(organizerId);
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

  async update(id: string, updateCompetitionDto: UpdateCompetitionDto): Promise<Competition> {
    const updateData: any = { ...updateCompetitionDto };

    // Convert date strings to Date objects if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    if (updateData.registrationDeadline) {
      updateData.registrationDeadline = new Date(updateData.registrationDeadline);
    }

    const competition = await this._competitionRepository.update(id, updateData);
    if (!competition) {
      throw new Error('Competition not found');
    }
    return competition;
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
    return this._competitionRepository.findRegisteredCompetitions(dancerId);
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
