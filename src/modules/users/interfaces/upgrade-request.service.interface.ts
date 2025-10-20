import { UpgradeRequest } from '../models/upgrade-request.schema';

export const IUpgradeRequestServiceToken = 'IUpgradeRequestService';

export interface IUpgradeRequestService {
    createRequest(data: any): Promise<UpgradeRequest>;
    getAllRequests(): Promise<UpgradeRequest[]>;
    getPendingRequests(): Promise<UpgradeRequest[]>;
    approveRequest(id: string, adminNote?: string): Promise<UpgradeRequest>;
    rejectRequest(id: string, adminNote?: string): Promise<UpgradeRequest>;
}