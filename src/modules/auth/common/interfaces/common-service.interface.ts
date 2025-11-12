import { Request, Response } from "express";
import { Admin } from "src/modules/admins/models/admins.schema";
import { User } from "src/modules/users/models/user.schema";

export const ICommonServiceToken = Symbol('ICommonService')

export interface ICommonService{

    logoutHandler(req:Request,res:Response):Promise<void>;
    handleGoogleAuth(
        credential: string,
        res:Response,
        role:'client'|'dancer'
    ):Promise<{accessToken:string,message:string}>;
    generateToken(user:User | Admin):Promise<{accessToken:string,refreshToken:string}>;
    setRefreshTokenCookie(
        res:Response,
        refreshToken:string,
    ):void;
    refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}