import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    ) {}

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
        const mongoFilter: any = {};

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
                .exec(),
            this.workshopModel.countDocuments(mongoFilter).exec()
        ]);

        return {
            workshops,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
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