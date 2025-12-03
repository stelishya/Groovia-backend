import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Competition } from '../models/competition.schema';
import { BaseRepository } from '../../../common/repositories/base.repo';

@Injectable()
export class CompetitionRepository extends BaseRepository<Competition, Competition & Document> {
  constructor(
    @InjectModel(Competition.name) private competitionModel: Model<Competition>,
  ) {
    super(competitionModel);
  }

  // Basic CRUD methods
  async create(data: Partial<Competition>): Promise<Competition> {
    const competition = new this.competitionModel(data);
    console.log("ith comp repo, competition : ",competition)
    return competition.save();
  }

  async findAll(): Promise<Competition[]> {
    return this.competitionModel.find().exec();
  }

  async update(id: string, data: Partial<Competition>): Promise<Competition | null> {
    return this.competitionModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.competitionModel.findByIdAndDelete(id).exec();
  }

  async findByIdPublic(id: string): Promise<Competition | null> {
    return this.findById(id);
  }

  // Add any competition-specific repository methods here
  async findByOrganizer(organizerId: string): Promise<Competition[]> {
    return this.competitionModel
      .find({ organizer_id: organizerId })
      .populate('organizer_id', 'username profileImage')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveCompetitions(): Promise<Competition[]> {
    return this.competitionModel
      .find({
        status: 'active',
        registrationDeadline: { $gte: new Date() }
      })
      .populate('organizer_id', 'username profileImage')
      .sort({ date: 1 })
      .exec();
  }

  async findByCategory(category: string): Promise<Competition[]> {
    return this.competitionModel
      .find({ category, status: 'active' })
      .populate('organizer_id', 'username profileImage')
      .sort({ date: 1 })
      .exec();
  }

  async findByStyle(style: string): Promise<Competition[]> {
    return this.competitionModel
      .find({ style, status: 'active' })
      .populate('organizer_id', 'username profileImage')
      .sort({ date: 1 })
      .exec();
  }
}
