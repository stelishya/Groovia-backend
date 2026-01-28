import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Events extends Document {
  declare _id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  clientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  dancerId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  event: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  budget: string;

  @Prop({
    type: String,
    enum: [
      'pending',
      'accepted',
      'rejected',
      'cancelled',
      'confirmed',
      'completed',
    ],
    default: 'pending',
  })
  status: string;

  @Prop({
    type: String,
    enum: ['pending', 'failed', 'paid'],
    default: 'pending',
  })
  paymentStatus: string;

  @Prop({ type: Number })
  acceptedAmount?: number;

  @Prop({ type: String })
  eventHistory: object[];
}

export const EventSchema = SchemaFactory.createForClass(Events);
export type EventDocument = Events;
