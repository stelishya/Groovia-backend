import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


export enum Gender {
    MALE = "Male",
    FEMALE = "Female",
    OTHER = "Other"
}
export enum Role {
    DANCER = "dancer",
    INSTRUCTOR = "instructor",
    ORGANIZER = "organizer",
    CLIENT = "client",
}
export enum Language {
    ENGLISH = "English",
    SPANISH = "Spanish",
    FRENCH = "French",
    GERMAN = "German",
    HINDI = "Hindi",
}

@Schema({ timestamps: true })
export class User {
    _id: Types.ObjectId;

    @Prop({ required: true, unique: true, trim: true })
    // match:/^[a-zA-Z0-9_]+$/})
    username: string;

    @Prop({ required: true, unique: true, match: /^\S+@\S+\.\S+$/ })
    email: string;

    @Prop({
        type: String,
        required: function (this: User) {
            return !this.googleId;
        },
        minlength: 6,
        validate: {
            validator: function (value: string) {
                return this.googleId || (value && value.length >= 6);
            },
            message: 'Password must be at least 6 characters long',
        },
    })
    password: string;

    @Prop({ enum: Language, default: Language.ENGLISH })
    language?: Language;

    @Prop({
        type: String,
        validate: {
            validator: (v: string) => /^\+?[0-9]{7,15}$/.test(v),
            message: 'Invalid phone number format',
        },
    })
    phone: string;

    @Prop({
        type: [String],
        required: true,
        enum: Role
    })
    role: string[];

    @Prop({ type: String, unique: true, sparse: true })
    googleId?: string;

    @Prop({ type: String })
    resetPasswordToken?: string;

    @Prop({ type: Date })
    resetPasswordExpires?: Date;

    @Prop({ type: Boolean, default: false })
    isVerified: boolean;

    @Prop({ type: Boolean, default: false })
    isBlocked: boolean;

    // Dancer Profile Fields
    @Prop({ type: String })
    bio?: string;

    @Prop({ type: Number, min: 0 })
    experienceYears?: number;

    @Prop({ type: [String] })
    portfolioLinks?: string[];

    @Prop({ type: [String] })
    danceStyles?: string[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
    likes: Types.ObjectId[];

    @Prop({ type: String })
    profileImage?: string;

    @Prop({ type: String })
    preferredLocation?: string;

    @Prop({ type: String, enum: Gender })
    gender?: string;

    @Prop({ type: Map, of: String })
    danceStyleLevels?: Map<string, string>;

    @Prop({
        type: [{
            awardName: { type: String },
            position: { type: String },
            year: { type: Object }
        }],
        default: []
    })
    achievements?: Array<{ awardName: string; position: string; year: number | string }>;

    @Prop({
        type: [{
            name: { type: String },
            url: { type: String },
            fileType: { type: String }
        }],
        default: []
    })
    certificates?: Array<{ name: string; url: string; fileType?: string }>;

    @Prop({ type: Boolean, default: false })
    availableForPrograms?: boolean;
}

export const userSchema = SchemaFactory.createForClass(User);

export type UserDocument = User & Document;











