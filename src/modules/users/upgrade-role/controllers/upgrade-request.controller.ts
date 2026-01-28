import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  Req,
  HttpCode,
  // HttpStatus,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { type Request } from 'express';
import {
  type IUpgradeRequestService,
  IUpgradeRequestServiceToken,
  type RequestBodyWithPotentialStrings,
} from '../interface/upgrade-request.service.interface';
import { CreateUpgradeRequestDto } from '../dto/upgrade-request.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { HttpStatus } from 'src/common/enums/http-status.enum';
import { JwtAuthGuard } from 'src/modules/auth/jwt/guards/jwtAuth.guard';

@Controller('users')
export class UpgradeRequestController {
  constructor(
    @Inject(IUpgradeRequestServiceToken)
    private readonly upgradeRequestService: IUpgradeRequestService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Public()
  @Post('upgrade-role')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'certificate', maxCount: 1 },
        { name: 'licenseDocument', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const dir =
              file.fieldname === 'licenseDocument'
                ? './uploads/licenses'
                : './uploads/certificates';
            cb(null, dir);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const prefix =
              file.fieldname === 'licenseDocument' ? 'license' : 'certificate';
            cb(null, `${prefix}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
            cb(null, true);
          } else {
            cb(new Error('Only image and PDF files are allowed!'), false);
          }
        },
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      },
    ),
  )
  async createUpgradeRequest(
    // @Body() body: CreateUpgradeRequestDto,
    @Body() body: RequestBodyWithPotentialStrings,
    @UploadedFiles()
    files: {
      certificate?: Express.Multer.File[];
      licenseDocument?: Express.Multer.File[];
    },
  ) {
    const certificateFile = files?.certificate?.[0];
    const licenseFile = files?.licenseDocument?.[0];

    const danceStyles =
      typeof body.danceStyles === 'string'
        ? JSON.parse(body.danceStyles)
        : body.danceStyles;

    const pastEventsCount = body.pastEventsCount
      ? Number(body.pastEventsCount)
      : body.pastEvents
        ? Number(body.pastEvents)
        : undefined;

    const availableForWorkshops =
      body.availableForWorkshops !== undefined
        ? String(body.availableForWorkshops) === 'true'
        : undefined;

    const upgradeData: CreateUpgradeRequestDto = {
      ...body,
      // Instructor fields (optional)
      danceStyles,
      experienceYears: body.experienceYears
        ? Number(body.experienceYears)
        : undefined,
      availableForWorkshops,
      preferredLocation: body.preferredLocation,
      additionalMessage: body.additionalMessage || body.message,
      certificateUrl: certificateFile
        ? `/uploads/certificates/${certificateFile.filename}`
        : undefined,
      portfolioLinks: body.portfolioLinks,
      // Organizer fields (optional)
      organizationName: body.organizationName,
      pastEventsCount,
      description: body.description,
      licenseDocumentUrl: licenseFile
        ? `/uploads/licenses/${licenseFile.filename}`
        : undefined,
    };

    return await this.upgradeRequestService.createRequest(upgradeData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('upgrade-requests')
  async getAllUpgradeRequests() {
    return await this.upgradeRequestService.getAllRequests();
  }

  @UseGuards(JwtAuthGuard)
  @Get('upgrade-status')
  async getMyUpgradeStatus(
    @ActiveUser('userId') userId: string,
    @Req() req: Request,
  ) {
    // console.log('request.user in controller:', req.user);
    console.log('userId from token in upgrade-status:', userId);
    const result = await this.upgradeRequestService.getRequestsByUser(userId);
    console.log('requests returned:', result);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('upgrade-requests/pending')
  async getPendingRequests() {
    return await this.upgradeRequestService.getPendingRequests();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('upgrade-requests/:id/approve')
  async approveRequest(
    @Param('id') id: string,
    @Body() body: { adminNote?: string },
  ) {
    return await this.upgradeRequestService.approveRequest(id, body.adminNote);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('upgrade-requests/:id/reject')
  async rejectRequest(
    @Param('id') id: string,
    @Body() body: { adminNote?: string },
  ) {
    return await this.upgradeRequestService.rejectRequest(id, body.adminNote);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-payment')
  async createUpgradePayment(
    @ActiveUser('userId') userId: string,
    @Body()
    body: { upgradeRequestId: string; amount: number; currency: string },
  ) {
    console.log('hi from upgrade-payment controller, body: ', body);
    return await this.upgradeRequestService.createPaymentOrder(
      userId,
      body.upgradeRequestId,
      body.amount,
      body.currency,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('upgrade-payment-confirm')
  async confirmUpgradePayment(
    @ActiveUser('userId') userId: string,
    @Body()
    body: {
      upgradeRequestId: string;
      paymentId: string;
      amount: number;
      currency: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
    },
  ) {
    console.log(
      'confirmUpgradePayment in upgrade-request.controller.ts received:',
      { userId, ...body },
    );
    return await this.upgradeRequestService.confirmPayment(
      userId,
      body.upgradeRequestId,
      body.paymentId,
      body.amount,
      body.currency,
      body.razorpayOrderId,
      body.razorpaySignature,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Patch('upgrade-payment-failed/:requestId')
  async markPaymentFailed(
    @ActiveUser('userId') userId: string,
    @Param('requestId') requestId: string,
  ) {
    return await this.upgradeRequestService.upgradePaymentFailed(
      userId,
      requestId,
    );
  }
}
