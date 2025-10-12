export const IAdminServiceToken = Symbol('IAdminService')

export interface IAdminService {
    getDashboard(): Promise<void>;
    getAllUsers(): Promise<void>;
}