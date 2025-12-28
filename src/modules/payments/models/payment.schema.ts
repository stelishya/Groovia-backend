import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus, PaymentType } from '../interfaces/payments.service.interface';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    amount: number;

    @Prop({
        type: String,
        enum: PaymentType,
        required: true
    })
    paymentType: PaymentType;

    @Prop({
        type: String,
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Prop({ required: true })
    referenceId: string; // ID of Workshop, Competition, Event, etc.

    @Prop()
    transactionId: string; // Razorpay Payment ID

    @Prop()
    orderId: string; // Razorpay Order ID

    @Prop({ required: true })
    description: string;

    @Prop({ type: Object })
    metadata: any;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
