import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { IAdminServiceToken } from './interfaces/admins.service.interface';
import type { IAdminService } from './interfaces/admins.service.interface';
import type{ GetAllUsersQueryDto } from './dto/admin.dto';
import { User } from '../users/models/user.schema';

@Controller('admins')
export class AdminsController {
    constructor(
        @Inject(IAdminServiceToken)
        private readonly _adminService: IAdminService,
    ) {}
    
    @Get('dashboard')
    async getDashboard(@Query() query: unknown, @Param() param: unknown){
        return this._adminService.getDashboard();
    }
    // @Get('users')
    // async getAllUsers(
    //     @Query() query: GetAllUsersQueryDto,
    // ):Promise<{users:User[];total:number}> {
    //     return await this._adminService.getAllUsers(query);
    // }
}
