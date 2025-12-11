import { Workshop } from "../models/workshop.schema";
import { CreateWorkshopDto } from "../dto/workshop.dto";

export const IWorkshopServiceToken = Symbol('IWorkshopService');

export interface IWorkshopService {
    create(createWorkshopDto: CreateWorkshopDto, file: any, instructorId: string): Promise<Workshop>;
    findAll(query: any): Promise<{ workshops: Workshop[], total: number, page: number, limit: number }>;
    findOne(id: string): Promise<Workshop>;
    update(id: string, updateWorkshopDto: any, file: any): Promise<Workshop>;
    remove(id: string): Promise<void>;
    getInstructorWorkshops(instructorId: string): Promise<Workshop[]>;
    
    // Booking & Payment Methods
    initiateWorkshopBooking(workshopId: string, userId: string): Promise<any>;
    confirmWorkshopBooking(workshopId: string, userId: string, paymentId: string, orderId: string, signature: string): Promise<any>;
    markPaymentFailed(workshopId: string, userId: string): Promise<void>;
    getBookedWorkshops(userId: string, search?: string, style?: string, sortBy?: string, page?: number, limit?: number): Promise<any>;
}