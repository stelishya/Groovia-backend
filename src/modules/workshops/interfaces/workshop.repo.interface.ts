import { WorkshopDocument } from '../models/workshop.schema';
import {
  PaginatedWorkshops,
  WorkshopFilters,
} from '../interfaces/workshop.service.interface';
import { CreateWorkshopDto } from '../dto/workshop.dto';
import { PipelineStage } from 'mongoose';

export const IWorkshopRepoToken = Symbol('IWorkshopRepo');

export interface IWorkshopRepo {
  findById(id: string): Promise<WorkshopDocument | null>;
  findAllWithFilters(filters: WorkshopFilters): Promise<PaginatedWorkshops>;
  update(
    id: string,
    updateWorkshopDto: Partial<CreateWorkshopDto>,
  ): Promise<WorkshopDocument | null>;
  create(workshopData: CreateWorkshopDto): Promise<WorkshopDocument>;
  delete(id: string): Promise<WorkshopDocument | null>;
  findByInstructor(instructorId: string): Promise<WorkshopDocument[]>;
  save(workshop: WorkshopDocument): Promise<WorkshopDocument>;
  countBookedWorkshops(pipeline: PipelineStage[]): Promise<number>;
  findBookedWorkshops(
    userId: string,
    pipeline: PipelineStage[],
  ): Promise<WorkshopDocument[]>;
}
