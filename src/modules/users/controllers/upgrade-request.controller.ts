import { 
    Controller, 
    Post, 
    Get, 
    Patch,
    Body, 
    Param,
    UseInterceptors,
    UploadedFile,
    Req,
    HttpCode,
    // HttpStatus,
    Inject
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import {type IUpgradeRequestService, IUpgradeRequestServiceToken } from '../interfaces/upgrade-request.service.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { HttpStatus } from 'src/common/enums/http-status.enum';

@Controller('users')
export class UpgradeRequestController {
    constructor(
        @Inject(IUpgradeRequestServiceToken)
        private readonly upgradeRequestService: IUpgradeRequestService
    ) {}

    @Public()
    @Post('upgrade-role')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('certificate', {
        storage: diskStorage({
            destination: './uploads/certificates',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `certificate-${uniqueSuffix}${extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                cb(null, true);
            } else {
                cb(new Error('Only image and PDF files are allowed!'), false);
            }
        },
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    }))
    async createUpgradeRequest(
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        const upgradeData = {
            ...body,
            danceStyles: JSON.parse(body.danceStyles),
            experienceYears: parseInt(body.experienceYears),
            availableForWorkshops: body.availableForWorkshops === 'true',
            certificateUrl: file ? `/uploads/certificates/${file.filename}` : undefined
        };

        return await this.upgradeRequestService.createRequest(upgradeData);
    }

    @Get('upgrade-requests')
    async getAllUpgradeRequests() {
        return await this.upgradeRequestService.getAllRequests();
    }

    @Get('upgrade-requests/pending')
    async getPendingRequests() {
        return await this.upgradeRequestService.getPendingRequests();
    }

    @Patch('upgrade-requests/:id/approve')
    async approveRequest(
        @Param('id') id: string,
        @Body() body: { adminNote?: string }
    ) {
        return await this.upgradeRequestService.approveRequest(id, body.adminNote);
    }

    @Patch('upgrade-requests/:id/reject')
    async rejectRequest(
        @Param('id') id: string,
        @Body() body: { adminNote?: string }
    ) {
        return await this.upgradeRequestService.rejectRequest(id, body.adminNote);
    }
}