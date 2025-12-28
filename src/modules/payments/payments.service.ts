import { Injectable } from '@nestjs/common';
import { IPaymentsService, PaymentStatus, PaymentType } from './interfaces/payments.service.interface';
import { PaymentsRepository } from './repositories/payments.repository';

@Injectable()
export class PaymentsService implements IPaymentsService {
    constructor(private readonly paymentsRepository: PaymentsRepository) { }

    async createRecord(data: {
        userId: string;
        amount: number;
        paymentType: PaymentType;
        status: PaymentStatus;
        referenceId: string;
        transactionId?: string;
        orderId?: string;
        description: string;
    }) {
        return await this.paymentsRepository.create(data);
    }

    async getHistory(userId: string, options: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        status?: string;
        sortBy?: string;
    }) {
        const { page = 1, limit = 10, search, type, status, sortBy } = options;
        const skip = (page - 1) * limit;

        const filters: any = {};
        if (search) {
            filters.description = { $regex: search, $options: 'i' };
        }
        if (type) {
            filters.paymentType = type;
        }
        if (status) {
            filters.status = status;
        }

        let sort: any = { createdAt: -1 };
        if (sortBy === 'amount') {
            sort = { amount: -1 };
        } else if (sortBy === 'oldest') {
            sort = { createdAt: 1 };
        }

        const { data, total } = await this.paymentsRepository.findWithFilters(
            userId,
            filters,
            sort,
            skip,
            limit
        );
        console.log("payment history in backend : ",data);

        return {
            payments: data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
