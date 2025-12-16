import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
    FAILED = 'failed'
}

@Schema({ timestamps: true })
export class Booking {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Workshop', required: true })
    workshop: Types.ObjectId;

    @Prop({ required: true })
    orderId: string;

    @Prop({ required: true })
    paymentId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
    status: string;

    @Prop()
    paymentSignature: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
