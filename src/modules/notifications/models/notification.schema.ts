import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum NotificationType {
    UPGRADE_APPROVED = 'upgrade_approved',
    UPGRADE_REJECTED = 'upgrade_rejected',
    WORKSHOP = 'workshop',
    GENERAL = 'general',
    EVENT_REQUEST_SENT = 'event_request_sent',
    EVENT_REQUEST_RECEIVED = 'event_request_received',
    EVENT_REQUEST_ACCEPTED = 'event_request_accepted',
    EVENT_REQUEST_REJECTED = 'event_request_rejected',
    EVENT_REQUEST_CANCELLED = 'event_request_cancelled',
}

@Schema({ timestamps: true })
export class Notification extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, enum: NotificationType, required: true })
    type: NotificationType;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    isRead: boolean;

    @Prop()
    adminNote?: string;

    @Prop({ type: Object, default: {} })
    metadata?: Record<string, any>;

    @Prop()
    createdAt: Date;

    @Prop()
    updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);