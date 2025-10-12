export const IHashingServiceToken = Symbol('IHashingService');

export interface IHashingService{
    hashPassword(password:string):Promise<string>;
    comparePassword(plainText:string, hash:string):Promise<boolean>
}