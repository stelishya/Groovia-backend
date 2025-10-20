import { Response } from "express";
import { Admin } from "src/modules/admins/models/admins.schema";

export const IAdminAuthServiceToken = 'IAdminAuthService';

export interface IAdminAuthService{
    login(
        // username:string,
        email:string,
        password:string,
        res:Response
    ):Promise<{admin:Admin,accessToken:string}>
    register(registerData:{
        username:string,
        password:string,
    }):Promise<Admin>
    logout(res: Response): Promise<{message: string}>
}
