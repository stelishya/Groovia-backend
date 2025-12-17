import { User } from '../../users/models/user.schema';
import { CreateRequestDto, updateBookingStatusDto, UpdateClientProfileDto } from '../dto/client.dto';
import { Events } from '../models/events.schema';

export const IClientInterfaceToken = 'IClientService';

export interface IClientService {
    findOne(id: string): Promise<Events>;
    uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<{ user: User; imageUrl: string }>;
    getProfileByUserId(userId: string): Promise<User>;
    updateClientProfile(userId: string, updateData: UpdateClientProfileDto): Promise<User>;
    createEventBookingPayment(eventId: string, userId: string): Promise<any>;
    verifyEventBookingPayment(eventId: string, paymentDetails: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Promise<any>;
    getAllDancers(options: {
        location?: string;
        sortBy?: string;
        page: number;
        limit: number;
        danceStyle?: string;
        search?: string;
    }): Promise<{ dancers: User[], total: number }>;
    getDancerProfile(dancerId: string): Promise<User>;
    createEventRequest(createRequestDto: CreateRequestDto, clientId: string): Promise<Events>;
    getEventRequests(clientId: string, options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        sortBy?: string;
    }): Promise<{ requests: Events[], total: number }>;
    updateEventRequestStatus(eventId: string, statusDto: updateBookingStatusDto): Promise<Events>;
    markPaymentFailed(eventId: string, userId: string): Promise<any>;
}