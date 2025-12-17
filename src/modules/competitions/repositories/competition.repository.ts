import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Competition } from '../models/competition.schema';
import { BaseRepository } from '../../../common/repositories/base.repo';
import { Types } from 'mongoose';

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
    console.log("ith comp repo, competition : ", competition)
    return competition.save();
  }

  async findAll(): Promise<Competition[]> {
    return this.competitionModel.find().populate('organizer_id', 'username profileImage').exec();
  }

  async find(query: any, sort?: any, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }> {
    const total = await this.competitionModel.countDocuments(query);
    const data = await this.competitionModel.find(query)
      .sort(sort || { createdAt: -1 })
      .skip(skip || 0)
      .limit(limit || 0)
      .populate('organizer_id', 'username profileImage')
      .exec();
    return { data, total };
  }

  async update(id: string, data: Partial<Competition>): Promise<Competition | null> {
    const updatedCompetition = await this.competitionModel.findByIdAndUpdate(id, data, { new: true }).exec();
    console.log("hello update competition", updatedCompetition)
    return updatedCompetition;
  }

  async delete(id: string): Promise<void> {
    await this.competitionModel.findByIdAndDelete(id).exec();
  }

  async findByIdPublic(id: string): Promise<Competition | null> {
    return this.competitionModel.findById(id)
      .populate('organizer_id', 'username profileImage')
      .populate('registeredDancers.dancerId', 'username email profileImage role availableForPrograms')
      .exec();
  }

  // Add any competition-specific repository methods here
  async findByOrganizer(organizerId: string, query: any = {}, sort: any = { createdAt: -1 }, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }> {
    const finalQuery = { organizer_id: new Types.ObjectId(organizerId), ...query };
    const total = await this.competitionModel.countDocuments(finalQuery);
    const data = await this.competitionModel
      .find(finalQuery)
      .populate('organizer_id', 'username profileImage')
      .populate('registeredDancers.dancerId', 'username email profileImage role availableForPrograms')
      .sort(sort)
      .skip(skip || 0)
      .limit(limit || 0)
      .exec();
    return { data, total };
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

  async findRegisteredCompetitions(dancerId: string, query: any = {}, sort: any = { createdAt: -1 }, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }> {
    const finalQuery = { 'registeredDancers.dancerId': new Types.ObjectId(dancerId), ...query };
    const total = await this.competitionModel.countDocuments(finalQuery);
    const data = await this.competitionModel
      .find(finalQuery)
      .populate('organizer_id', 'username profileImage')
      .sort(sort)
      .skip(skip || 0)
      .limit(limit || 0)
      .exec();
    console.log("registeredCompetitions in comp repo, result : ", data)
    return { data, total };
  }
}
