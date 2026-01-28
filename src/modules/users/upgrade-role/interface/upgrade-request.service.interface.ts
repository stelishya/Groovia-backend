import {
  CreateUpgradeRequestDto,
  PaymentConfirmationResponse,
  PaymentFailedResponse,
  PaymentOrderResponse,
  UserUpgradeRequestResponse,
} from '../dto/upgrade-request.dto';
import {
  UpgradeRequest,
  UpgradeRequestDocument,
} from '../models/upgrade-request.schema';

export const IUpgradeRequestServiceToken = 'IUpgradeRequestService';

export interface IUpgradeRequestService {
  createRequest(data: unknown): Promise<UpgradeRequestDocument>;
  getAllRequests(): Promise<UpgradeRequestDocument[]>;
  getPendingRequests(): Promise<UpgradeRequestDocument[]>;
  getRequestsByUser(userId: string): Promise<UserUpgradeRequestResponse[]>;
  approveRequest(
    id: string,
    adminNote?: string,
  ): Promise<UpgradeRequestDocument>;
  rejectRequest(
    id: string,
    adminNote?: string,
  ): Promise<UpgradeRequestDocument>;
  createPaymentOrder(
    userId: string,
    upgradeRequestId: string,
    amount: number,
    currency: string,
  ): Promise<PaymentOrderResponse>;
  confirmPayment(
    userId: string,
    upgradeRequestId: string,
    paymentId: string,
    amount: number,
    currency: string,
    razorpayOrderId?: string,
    razorpaySignature?: string,
  ): Promise<PaymentConfirmationResponse>;
  upgradePaymentFailed(
    userId: string,
    requestId: string,
  ): Promise<PaymentFailedResponse>;
}

// Interface to type specific fields in the body that might come as strings
export interface RequestBodyWithPotentialStrings
  extends CreateUpgradeRequestDto {
  pastEvents?: string | number;
  message?: string;
}
