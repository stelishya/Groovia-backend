import { Workshop } from '../models/workshop.schema';
import { CreateWorkshopDto } from '../dto/workshop.dto';
import { FilterQuery, Types } from 'mongoose';

export const IWorkshopServiceToken = Symbol('IWorkshopService');

//specific response interfaces
export interface PaymentInitiationResponse {
  workshop: Workshop;
  amount: number;
  currency: string;
  orderId: string;
}

export interface BookingConfirmationResponse {
  success: boolean;
  message: string;
  workshop: Workshop;
}

export interface PaginatedBookedWorkshops {
  workshops: Workshop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
// Helper Interface for Participant Item
export interface WorkshopParticipant {
  dancerId: Types.ObjectId;
  paymentStatus: string;
  attendance: boolean;
  registeredAt: Date;
}
export interface WorkshopFilters {
  search?: string;
  style?: string;
  mode?: string;
  status?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  skipTotal?: boolean;
}

export interface PaginatedWorkshops {
  workshops: Workshop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IWorkshopService {
  create(
    body: CreateWorkshopDto,
    file: Express.Multer.File,
    instructorId: string,
  ): Promise<Workshop>;
  findAll(query: FilterQuery<Workshop>): Promise<{
    workshops: Workshop[];
    total: number;
    page: number;
    limit: number;
  }>;
  findOne(id: string): Promise<Workshop>;
  update(
    id: string,
    updateWorkshopDto: Partial<CreateWorkshopDto>,
    file: Express.Multer.File,
  ): Promise<Workshop>;
  remove(id: string): Promise<void>;
  getInstructorWorkshops(instructorId: string): Promise<Workshop[]>;

  // Booking & Payment Methods
  initiateWorkshopBooking(
    workshopId: string,
    userId: string,
  ): Promise<PaymentInitiationResponse>;
  confirmWorkshopBooking(
    workshopId: string,
    userId: string,
    paymentId: string,
    orderId: string,
    signature: string,
  ): Promise<BookingConfirmationResponse>;
  markPaymentFailed(workshopId: string, userId: string): Promise<void>;
  getBookedWorkshops(
    userId: string,
    options: {
      search?: string;
      style?: string;
      sortBy?: string;
      page?: string;
      limit?: string;
    },
  ): Promise<PaginatedBookedWorkshops>;

  // Attendance Methods
  recordAttendanceJoin(workshopId: string, userId: string): Promise<void>;
  recordAttendanceLeave(workshopId: string, userId: string): Promise<void>;
}
