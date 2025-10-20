import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


export enum Gender {
    MALE = "Male",
    FEMALE = "Female",
    OTHER = "Other"
}
export enum Role{
    DANCER = "dancer",
    INSTRUCTOR = "instructor",
    ORGANIZER = "organizer",
    CLIENT = "client",
}

@Schema({timestamps:true})
export class User{
    _id:Types.ObjectId;

    @Prop({required:true, unique:true, trim:true,match:/^[a-zA-Z0-9_]+$/})
    username:string;

    @Prop({required:true, unique:true,match:/^\S+@\S+\.\S+$/})
    email:string;

    @Prop({
        type:String,
        required:function(this:User){
            return !this.googleId;
        },
        minlength:6,
        // validate:{
        //     validator:(value:string)=>{
        //         return this.googleId || (value && value.length >= 6);
        //     },
        //     message: 'Password must be at least 6 characters long',
        // },
    })
    password:string;

    @Prop({
        type:String,
        validate:{
            validator:(v:string)=>/^\+?[0-9]{7,15}$/.test(v),
            message: 'Invalid phone number format',
        },
    })
    phone:string;

    @Prop({
        type:[String],
        required:true,
        enum:Role
    })
    role:string[];

    @Prop({type:String,unique:true,sparse:true})
    googleId?:string;

    @Prop({type:String})
    resetPasswordToken?:string;

    @Prop({type:Date})
    resetPasswordExpires?:Date;

    @Prop({type:Boolean,default:false})
    isVerified:boolean;

    @Prop({type:Boolean,default:false})
    isBlocked:boolean;
}

export const userSchema = SchemaFactory.createForClass(User);














