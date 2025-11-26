import { UpgradeRequest } from '../models/upgrade-request.schema';

export const IUpgradeRequestServiceToken = 'IUpgradeRequestService';

export interface IUpgradeRequestService {
    createRequest(data: any): Promise<UpgradeRequest>;
    getAllRequests(): Promise<UpgradeRequest[]>;
    getPendingRequests(): Promise<UpgradeRequest[]>;
    getRequestsByUser(userId: string): Promise<any[]>;
    approveRequest(id: string, adminNote?: string): Promise<UpgradeRequest>;
    rejectRequest(id: string, adminNote?: string): Promise<UpgradeRequest>;
    createPaymentOrder(userId: string, upgradeRequestId: string, amount: number, currency: string): Promise<any>;
    confirmPayment(userId: string, upgradeRequestId: string, paymentId: string, amount: number, currency: string, razorpayOrderId?: string, razorpaySignature?: string): Promise<{ success: boolean }>;
    upgradePaymentFailed(userId: string, requestId: string): Promise<any>;
}