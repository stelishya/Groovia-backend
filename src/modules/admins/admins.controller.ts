import { Controller, Get, HttpStatus, Inject, Logger, Param, Patch, Query } from '@nestjs/common';
import { IAdminServiceToken } from './interfaces/admins.service.interface';
import type { IAdminService } from './interfaces/admins.service.interface';
import type{ GetAllUsersQueryDto } from './dto/admin.dto';
import { User } from '../users/models/user.schema';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '../users/dto/user.dto';
import { Role } from 'src/common/enums/role.enum';
import { Types } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admins')
export class AdminsController {
    private readonly _logger = new Logger(AdminsController.name);
    constructor(
        @Inject(IAdminServiceToken)
        private readonly _adminService: IAdminService,
    ) {}
    
    // @Get('dashboard')
    // async getDashboard(@Query() query: unknown, @Param() param: unknown){
    //     return this._adminService.getDashboard();
    // }
    @Get('users')
    async getAllUsers(
        @Query() query: GetAllUsersQueryDto,
    ):Promise<{users:User[];total:number}> {
        return await this._adminService.getAllUsers(query);
    }

    @Patch('users/:userId/status')
    @ApiOperation({summary:"Block/Unblock user (toggle)"})
    @ApiResponse({
        status:HttpStatus.OK,
        description:"User status toggled successfully",
        type:SuccessResponseDto
    })
    @Roles(Role.ADMIN)
    async blockUser(
        @Param('userId') userId:string,
    ):Promise<SuccessResponseDto>{
        this._logger.log(` Toggle Block user ${userId}`)
        return await this._adminService.blockUser(new Types.ObjectId(userId));
    }

}
