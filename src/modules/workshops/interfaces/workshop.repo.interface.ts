import { Workshop, WorkshopDocument } from "../models/workshop.schema";
import { PaginatedWorkshops, WorkshopFilters } from "../repositories/workshops.repository";

export const IWorkshopRepoToken = Symbol('IWorkshopRepo');

export interface IWorkshopRepo {
    findById(id: string): Promise<WorkshopDocument | null>;
    findAllWithFilters(filters: WorkshopFilters): Promise<PaginatedWorkshops>;
    update(id: string, updateWorkshopDto: any): Promise<WorkshopDocument | null>;
    create(workshopData: any): Promise<WorkshopDocument>;
    delete(id: string): Promise<WorkshopDocument | null>;
    findByInstructor(instructorId: string): Promise<WorkshopDocument[]>;
    save(workshop: WorkshopDocument): Promise<WorkshopDocument>;
    countBookedWorkshops(pipeline: any[]): Promise<number>;
    findBookedWorkshops(userId: string, pipeline: any[]): Promise<any[]>;
}