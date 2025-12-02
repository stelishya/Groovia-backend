import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Workshop, WorkshopDocument } from './models/workshop.schema';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { AwsS3Service } from '../../common/storage/aws-s3.service';
import { WorkshopsRepository } from './repositories/workshops.repo';

@Injectable()
export class WorkshopsService {
    constructor(
        @InjectModel(Workshop.name) private workshopModel: Model<WorkshopDocument>,
        private readonly awsS3Service: AwsS3Service,
        private readonly workshopsRepository: WorkshopsRepository
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

    async findAll(query: any): Promise<{workshops:Workshop[],total:number,page:number,limit:number}> {
        return this.workshopsRepository.findAllWithFilters(query);
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
        // Convert string to ObjectId for querying
        const workshops = await this.workshopModel.find({
            instructor: new Types.ObjectId(instructorId)
        }).exec();
        return workshops;
    }
}
