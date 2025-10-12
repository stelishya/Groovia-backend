export const IAdminRepoToken = Symbol('IAdminRepo')

export interface IAdminRepo{
    findOne():Promise<void>;
    create():Promise<void>;
}