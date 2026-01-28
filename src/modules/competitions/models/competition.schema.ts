import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompetitionDocument = Competition & Document;

export enum CompetitionCategory {
  SOLO = 'solo',
  GROUP = 'group',
  DUET = 'duet',
}

export enum CompetitionLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum CompetitionMode {
  OFFLINE = 'offline',
  ONLINE = 'online',
}

export enum CompetitionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ _id: false })
export class RegisteredDancer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dancerId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded', 'paid'],
  })
  paymentStatus: string;

  @Prop({ type: Number, default: 0 })
  score: number;

  @Prop({ type: Date, default: Date.now })
  registeredAt: Date;

  @Prop({ type: Boolean, default: false })
  attendance?: boolean;
}

const RegisteredDancerSchema = SchemaFactory.createForClass(RegisteredDancer);

@Schema({ timestamps: true })
export class Competition extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  organizer_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: CompetitionCategory })
  category: CompetitionCategory;

  @Prop({ required: true })
  style: string;

  @Prop({ required: true, enum: CompetitionLevel })
  level: CompetitionLevel;

  @Prop({ required: true })
  age_category: string;

  @Prop({ required: true, enum: CompetitionMode })
  mode: CompetitionMode;

  @Prop({ required: true })
  duration: string; // e.g., "2 hours", "30 minutes"

  @Prop()
  location?: string;

  @Prop()
  meeting_link?: string;

  @Prop({ required: true })
  posterImage: string;

  @Prop()
  document?: string; // PDF URL for rules/regulations

  @Prop({ required: true, type: Number, min: 0 })
  fee: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, type: Number })
  maxParticipants: number;

  @Prop({ required: true, type: Date })
  registrationDeadline: Date;

  @Prop({
    type: String,
    enum: CompetitionStatus,
    default: CompetitionStatus.ACTIVE,
  })
  status: CompetitionStatus;

  @Prop({ type: [RegisteredDancerSchema], default: [] })
  registeredDancers: RegisteredDancer[];

  @Prop({ type: Object }) // Flexible object for results structure
  results?: Record<string, unknown> | Record<string, unknown>[];
}

export const CompetitionSchema = SchemaFactory.createForClass(Competition);

// Add indexes for better query performance
CompetitionSchema.index({ date: 1 });
CompetitionSchema.index({ registrationDeadline: 1 });
CompetitionSchema.index({ organizer_id: 1 });
CompetitionSchema.index({ status: 1 });
CompetitionSchema.index({ category: 1 });
CompetitionSchema.index({ level: 1 });
CompetitionSchema.index({ style: 1 });
