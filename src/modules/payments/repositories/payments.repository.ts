import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../models/payment.schema';

@Injectable()
export class PaymentsRepository {
    constructor(
        @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    ) { }

    async create(data: any): Promise<PaymentDocument> {
        const newPayment = new this.paymentModel(data);
        return await newPayment.save();
    }

    async findWithFilters(userId: string, filters: any, sort: any, skip: number, limit: number) {
        let objectId: any = null;
        try {
            objectId = new Types.ObjectId(userId);
        } catch (err) {
            objectId = null;
        }

        const userIdQuery = objectId ? { $in: [objectId, userId] } : userId;
        const query = { userId: userIdQuery, ...filters };

        const [data, total] = await Promise.all([
            this.paymentModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec(),
            this.paymentModel.countDocuments(query),
        ]);

        return { data, total };
    }

    async findById(id: string): Promise<PaymentDocument | null> {
        return await this.paymentModel.findById(id).exec();
    }

    async update(id: string, updateData: any): Promise<PaymentDocument | null> {
        return await this.paymentModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
    }
}
