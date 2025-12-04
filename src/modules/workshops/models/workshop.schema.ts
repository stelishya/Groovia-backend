import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkshopDocument = Workshop & Document;

export enum WorkshopMode {
    OFFLINE = 'offline',
    ONLINE = 'online',
}

export enum WorkshopStatus {
    UPCOMING = 'upcoming',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
}

@Schema()
class Participant {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    dancerId: Types.ObjectId;

    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: string;

    @Prop({ type: Boolean, default: false })
    attendance: boolean;

    @Prop({ type: Date, default: Date.now })
    registeredAt: Date;
}

const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema()
class Session {
    @Prop({ type: Types.ObjectId, auto: true })
    sessionId: Types.ObjectId;

    @Prop({ required: true })
    date: Date;

    @Prop({ required: true })
    startTime: string;

    @Prop({ required: true })
    endTime: string;
}

const SessionSchema = SchemaFactory.createForClass(Session);

@Schema({ timestamps: true })
export class Workshop {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    instructor: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    style: string;

    @Prop({ type: String, enum: WorkshopMode, required: true })
    mode: string;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    fee: number;

    @Prop({ required: true })
    maxParticipants: number;

    @Prop({ required: true })
    posterImage: string;

    @Prop()
    location: string;

    @Prop()
    meetingLink: string;

    @Prop({ type: [ParticipantSchema], default: [] })
    participants: Participant[];

    @Prop({ required: true })
    deadline: Date;

    @Prop({ type: String, enum: WorkshopStatus, default: WorkshopStatus.UPCOMING })
    status: string;

    @Prop({ default: 0 })
    ratings: number;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Review' }], default: [] })
    reviews: Types.ObjectId[];

    @Prop({ type: [SessionSchema], required: true })
    sessions: Session[];
}

export const WorkshopSchema = SchemaFactory.createForClass(Workshop);
