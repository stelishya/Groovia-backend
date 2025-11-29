import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workshop, WorkshopDocument } from './models/workshop.schema';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { AwsS3Service } from '../../common/storage/aws-s3.service';

@Injectable()
export class WorkshopsService {
    constructor(
        @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>,
        private readonly awsS3Service: AwsS3Service,
    ) { }

    async create(createWorkshopDto: CreateWorkshopDto, file: any, instructorId: string): Promise<Workshop> {
        let posterImage = createWorkshopDto.posterImage;

        // Upload file to S3 if provided
        if (file && file.buffer) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `workshops/${uniqueSuffix}-${file.originalname}`;
            const uploadResult = await this.awsS3Service.uploadBuffer(file.buffer, fileName, file.mimetype);
            posterImage = uploadResult.Location;
        }

        const newWorkshop = new this.workshopModel({
            ...createWorkshopDto,
            posterImage,
            instructor: new Types.ObjectId(instructorId),
        });
        return newWorkshop.save();
    }

    async findAll(query: any): Promise<Workshop[]> {
        // Implement filtering logic based on query params (style, date, etc.)
        // For now, return all
        return this.workshopModel.find().populate('instructor', 'username profileImage').exec();
    }

    async findOne(id: string): Promise<Workshop> {
        const workshop = await this.workshopModel.findById(id).populate('instructor', 'username profileImage').exec();
        if (!workshop) {
            throw new NotFoundException(`Workshop with ID ${id} not found`);
        }
        return workshop;
    }

    async update(id: string, updateWorkshopDto: any): Promise<Workshop> {
        const updatedWorkshop = await this.workshopModel.findByIdAndUpdate(id, updateWorkshopDto, { new: true }).exec();
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
        return this.workshopModel.find({ instructor: instructorId }).exec();
    }
}
