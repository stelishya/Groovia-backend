import { Inject, Injectable } from '@nestjs/common';
import { IAdminService } from './interfaces/admins.service.interface';
import { IAdminRepoToken } from './interfaces/admins.repo.interface';
import type{ IAdminRepo } from './interfaces/admins.repo.interface';

@Injectable()
export class AdminsService implements IAdminService {
    constructor(
        @Inject(IAdminRepoToken)
        private readonly _adminRepo: IAdminRepo,
    ){}
    async getDashboard(): Promise<void> {

    }

    async getAllUsers(): Promise<void> {
        console.log('working');
    }
}
