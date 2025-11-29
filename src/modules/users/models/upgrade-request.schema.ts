import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export enum UpgradeRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}

@Schema({ timestamps: true })
export class UpgradeRequest {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: String, required: true })
    username: string;

    @Prop({ type: String, required: true })
    email: string;

    @Prop({ type: [String] })
    danceStyles?: string[];

    @Prop({ type: Number })
    experienceYears?: number;

    @Prop({ type: String })
    bio?: string;

    @Prop({ type: String })
    portfolioLinks?: string;

    @Prop({ type: String })
    certificateUrl?: string;

    @Prop({ type: String })
    organizationName?: string;

    @Prop({ type: Number })
    pastEventsCount?: number;

    @Prop({ type: String })
    description?: string;

    @Prop({ type: String })
    licenseDocumentUrl?: string;

    @Prop({ type: Boolean, default: false })
    availableForWorkshops: boolean;

    @Prop({ type: String })
    preferredLocation?: string;

    @Prop({ type: String })
    additionalMessage?: string;

    @Prop({
        type: String,
        enum: UpgradeRequestStatus,
        default: UpgradeRequestStatus.PENDING
    })
    status: UpgradeRequestStatus;

    @Prop({ type: String, enum: ['pending', 'paid','failed'] })
    paymentStatus?: string;

    @Prop({ type: String })
    adminNote?: string;

    @Prop({ type: Date })
    reviewedAt?: Date;
}

export const upgradeRequestSchema = SchemaFactory.createForClass(UpgradeRequest);