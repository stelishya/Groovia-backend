import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workshop, WorkshopDocument } from '../models/workshop.schema';

export interface WorkshopFilters {
    search?: string;
    style?: string;
    mode?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedWorkshops {
    workshops: Workshop[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable()
export class WorkshopsRepository {
    constructor(
        @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>
    ) { }

    async findAllWithFilters(filters: WorkshopFilters): Promise<PaginatedWorkshops> {
        const {
            search = '',
            style = '',
            mode = '',
            sortBy = 'startDate',
            page = 1,
            limit = 10
        } = filters;

        // Build MongoDB filter
        const mongoFilter: any = {
            // startDate: { $gte: new Date() }
        };

        if (search) {
            mongoFilter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (style) {
            mongoFilter.style = { $regex: style, $options: 'i' };
        }

        if (mode) {
            mongoFilter.mode = mode.toLowerCase();
        }

        // Build sort
        const sortOptions: any = this.getSortOptions(sortBy);

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
            this.workshopModel.countDocuments(mongoFilter).exec()
        ]);
        console.log("explore workshops:", workshops);

        return {
            workshops,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async create(data: Partial<Workshop>): Promise<WorkshopDocument> {
        const workshop = new this.workshopModel(data);
        return workshop.save();
    }

    async findById(id: string): Promise<WorkshopDocument | null> {
        return this.workshopModel.findById(id).populate('instructor', 'username profileImage').exec();
    }

    async update(id: string, data: Partial<Workshop>): Promise<WorkshopDocument | null> {
        return this.workshopModel.findByIdAndUpdate(id, data, { new: true }).populate('instructor', 'username profileImage').exec();
    }

    async delete(id: string): Promise<WorkshopDocument | null> {
        return this.workshopModel.findByIdAndDelete(id).exec();
    }

    async findByInstructor(instructorId: string): Promise<WorkshopDocument[]> {
        return this.workshopModel.find({ instructor: new Types.ObjectId(instructorId) }).exec();
    }

    async save(workshop: WorkshopDocument): Promise<WorkshopDocument> {
        return workshop.save();
    }

    async findBookedWorkshops(
        userId: string,
        pipeline: any[]
    ): Promise<any[]> {
        return this.workshopModel.aggregate(pipeline).exec();
    }

    async countBookedWorkshops(pipeline: any[]): Promise<number> {
        const result = await this.workshopModel.aggregate([...pipeline, { $count: 'total' }]).exec();
        return result.length > 0 ? result[0].total : 0;
    }

    private getSortOptions(sortBy: string): any {
        const sortMap: { [key: string]: any } = {
            'fee': { fee: 1 },
            'title': { title: 1 },
            'popularity': { participantsCount: -1 },
            'startDate': { startDate: -1 }
        };

        return sortMap[sortBy] || sortMap['startDate'];
    }
}