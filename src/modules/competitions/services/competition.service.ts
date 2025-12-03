import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CompetitionRepository } from '../repositories/competition.repository';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { Competition, CompetitionStatus } from '../models/competition.schema';

@Injectable()
export class CompetitionService {
  constructor(private readonly competitionRepository: CompetitionRepository) {}

  async create(createCompetitionDto: CreateCompetitionDto, organizerId: string): Promise<Competition> {
    const competitionData = {
      ...createCompetitionDto,
      organizer_id: new Types.ObjectId(organizerId),
      date: new Date(createCompetitionDto.date),
      registrationDeadline: new Date(createCompetitionDto.registrationDeadline),
    };
    console.log("ith comp service, competitionData : ",competitionData)
    return this.competitionRepository.create(competitionData);
  }

  async findAll(): Promise<Competition[]> {
    return this.competitionRepository.findAll();
  }

  async findOne(id: string): Promise<Competition> {
    const competition = await this.competitionRepository.findByIdPublic(id);
    if (!competition) {
      throw new Error('Competition not found');
    }
    return competition;
  }

  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    return this.competitionRepository.findByOrganizer(organizerId);
  }

  async findActiveCompetitions(): Promise<Competition[]> {
    return this.competitionRepository.findActiveCompetitions();
  }

  async findByCategory(category: string): Promise<Competition[]> {
    return this.competitionRepository.findByCategory(category);
  }

  async findByStyle(style: string): Promise<Competition[]> {
    return this.competitionRepository.findByStyle(style);
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

    const competition = await this.competitionRepository.update(id, updateData);
    if (!competition) {
      throw new Error('Competition not found');
    }
    return competition;
  }

  async remove(id: string): Promise<void> {
    await this.competitionRepository.delete(id);
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

    const updatedCompetition = await this.competitionRepository.update(competitionId, competition);
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
    const updatedCompetition = await this.competitionRepository.update(competitionId, competition);
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
    const updatedCompetition = await this.competitionRepository.update(competitionId, competition);
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }

  async finalizeResults(competitionId: string, results: any): Promise<Competition> {
    const updatedCompetition = await this.competitionRepository.update(competitionId, {
      results,
      status: CompetitionStatus.COMPLETED
    });
    if (!updatedCompetition) {
      throw new Error('Failed to update competition');
    }
    return updatedCompetition;
  }
}
