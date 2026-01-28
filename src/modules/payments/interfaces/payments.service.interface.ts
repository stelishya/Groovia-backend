import { Types } from 'mongoose';

export const IPaymentsServiceToken = Symbol('IPaymentsService');

export enum PaymentType {
  WORKSHOP = 'workshop',
  COMPETITION = 'competition',
  EVENT_BOOKING = 'event_booking',
  ROLE_UPGRADE = 'role_upgrade',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export interface PaymentRecord {
  _id?: unknown;
  userId: Types.ObjectId;
  amount: number;
  paymentType: PaymentType;
  status: PaymentStatus;
  referenceId: string;
  transactionId?: string;
  orderId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentHistoryResponse {
  payments: PaymentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPaymentsService {
  createRecord(data: {
    userId: string;
    amount: number;
    paymentType: PaymentType;
    status: PaymentStatus;
    referenceId: string;
    transactionId?: string;
    orderId?: string;
    description: string;
  }): Promise<PaymentRecord>;

  getHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      status?: string;
      sortBy?: string;
    },
  ): Promise<PaymentHistoryResponse>;
}
