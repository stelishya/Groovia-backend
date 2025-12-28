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
    }): Promise<any>;

    getHistory(userId: string, options: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        status?: string;
        sortBy?: string;
    }): Promise<any>;
}
