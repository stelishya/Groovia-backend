import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, SortOrder, Types } from 'mongoose';
import { Workshop, WorkshopDocument } from '../models/workshop.schema';
import { PaginatedWorkshops, WorkshopFilters } from '../interfaces/workshop.service.interface';

@Injectable()
export class WorkshopsRepository {
  constructor(
    @InjectModel(Workshop.name) 
    private workshopModel: Model<WorkshopDocument>,
  ) {}

  async findAllWithFilters(
    filters: WorkshopFilters,
  ): Promise<PaginatedWorkshops> {
    const {
      search = '',
      style = '',
      mode = '',
      sortBy = 'startDate',
      page = 1,
      limit = 10,
    } = filters;

    // Build MongoDB filter
    const mongoFilter: FilterQuery<Workshop> = {
      // startDate: { $gte: new Date() }
    };

    if (search) {
      mongoFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (style) {
      mongoFilter.style = { $regex: style, $options: 'i' };
    }

    if (mode) {
      mongoFilter.mode = mode.toLowerCase();
    }

    // Build sort
    const sortOptions: Record<string, SortOrder> = this.getSortOptions(sortBy);

    // Pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [workshops, total] = await Promise.all([
      this.workshopModel
        .find(mongoFilter)
        .populate('instructor', 'username profileImage')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.workshopModel.countDocuments(mongoFilter).exec(),
    ]);
    console.log('explore workshops:', workshops);

    return {
      workshops:workshops as unknown as Workshop[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Partial<Workshop>): Promise<WorkshopDocument> {
    const workshop = new this.workshopModel(data);
    return workshop.save();
  }

  async findById(id: string): Promise<WorkshopDocument | null> {
    return this.workshopModel
      .findById(id)
      .populate('instructor', 'username profileImage')
      .exec();
  }

  async update(
    id: string,
    data: Partial<Workshop>,
  ): Promise<WorkshopDocument | null> {
    return this.workshopModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('instructor', 'username profileImage')
      .exec();
  }

  async delete(id: string): Promise<WorkshopDocument | null> {
    return this.workshopModel.findByIdAndDelete(id).exec();
  }

  async findByInstructor(instructorId: string): Promise<WorkshopDocument[]> {
    return this.workshopModel
      .find({ instructor: new Types.ObjectId(instructorId) })
      .exec();
  }

  async save(workshop: WorkshopDocument): Promise<WorkshopDocument> {
    return workshop.save();
  }

  async findBookedWorkshops(
    userId: string,
    pipeline: PipelineStage[],
  ): Promise<WorkshopDocument[]> {
    return this.workshopModel.aggregate(pipeline).exec();
  }

  async countBookedWorkshops(pipeline: PipelineStage[]): Promise<number> {
    const result = await this.workshopModel
      .aggregate([...pipeline, { $count: 'total' }])
      .exec();
    return result.length > 0 ? result[0].total : 0;
  }

  private getSortOptions(sortBy: string): Record<string, SortOrder> {
    const sortMap: Record<string, Record<string, SortOrder>> = {
      fee: { fee: 1 },
      title: { title: 1 },
      popularity: { participantsCount: -1 },
      startDate: { startDate: -1 },
    };

    return sortMap[sortBy] || sortMap['startDate'];
  }
}
