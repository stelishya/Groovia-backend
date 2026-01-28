import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import { Payment, PaymentDocument } from '../models/payment.schema';

@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async create(data: Partial<Payment>): Promise<PaymentDocument> {
    const newPayment = new this.paymentModel(data);
    return await newPayment.save();
  }

  async findWithFilters(
    userId: string,
    filters: FilterQuery<Payment>,
    sort: Record<string, SortOrder> | string,
    skip: number,
    limit: number,
  ) {
    let objectId: Types.ObjectId | null = null;
    try {
      objectId = new Types.ObjectId(userId);
    } catch (err) {
      objectId = null;
    }

    const userIdQuery = objectId ? { $in: [objectId, userId] } : userId;
    const query: FilterQuery<Payment> = { userId: userIdQuery, ...filters };

    const [data, total] = await Promise.all([
      this.paymentModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<PaymentDocument | null> {
    return await this.paymentModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: UpdateQuery<PaymentDocument>,
  ): Promise<PaymentDocument | null> {
    return await this.paymentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }
}
