import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class AttendanceRecord {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  dancerId: Types.ObjectId;

  @Prop({ type: Date })
  joinTime: Date;

  @Prop({ type: Date, required: false })
  leaveTime?: Date;

  @Prop({ type: Number, default: 0 })
  duration: number; // in minutes

  @Prop({
    type: String,
    enum: ['present', 'absent', 'pending'],
    default: 'pending',
  })
  status: string;
}

export const AttendanceRecordSchema =
  SchemaFactory.createForClass(AttendanceRecord);

@Schema()
class VideoSession {
  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: Date })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt: Date;

  @Prop({ type: String })
  sessionName: string;
}

export const VideoSessionSchema = SchemaFactory.createForClass(VideoSession);
