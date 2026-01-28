import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { IOtpService } from '../../modules/auth/user-auth/interfaces/otp.service.interface';
import {
  type IOtpRepository,
  IOtpRepositoryToken,
} from '../../modules/auth/user-auth/interfaces/otp.repo.interface';
import * as otpGenerator from 'otp-generator';
import { HttpStatus } from 'src/common/enums/http-status.enum';

@Injectable()
export class OtpService implements IOtpService {
  private readonly _logger = new Logger(OtpService.name);

  constructor(
    @Inject(IOtpRepositoryToken)
    private readonly _otpRepository: IOtpRepository,
  ) {}

  async createOtp(email: string): Promise<string> {
    try {
      const otp = this.generateOtp();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      const success = await this._otpRepository.upsert(
        { email },
        { otp, expiresAt, isVerified: false },
      );

      if (!success) {
        throw new HttpException(
          'Could not create OTP',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return otp;
    } catch (error) {
      this._logger.error(
        `Failed to create otp for email ${email}: ${error.message}`,
      );
      throw new HttpException(
        'Failed to create otp',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    return this._otpRepository.findOneAndUpdate(
      {
        email,
        otp,
        expiresAt: { $gt: new Date() },
        isVerified: false,
      },
      {
        isVerified: true,
      },
    );
  }

  private generateOtp(): string {
    return otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
  }
}
