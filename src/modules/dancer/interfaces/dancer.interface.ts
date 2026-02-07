import { User } from 'src/modules/users/models/user.schema';
import { UpdateDancerProfileDto, CertificateDto } from '../dto/dancer.dto';
import { Events } from 'src/modules/client/models/events.schema';
import { Request } from 'express';

export const IDancerServiceToken = 'IDancerService';

export interface IDancerService {
  getProfileByUserId(userId: string): Promise<User>;
  uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ user: Omit<User, 'password'>; imageUrl: string }>;
  uploadCertificate(
    userId: string,
    file: Express.Multer.File,
    certificateName?: string,
  ): Promise<CertificateDto>;
  updateProfile(
    userId: string,
    updateData: UpdateDancerProfileDto,
  ): Promise<Omit<User, 'password'>>;
  getEventRequests(
    userId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      status?: string;
      sortBy?: string;
    },
  ): Promise<{ requests: Events[]; total: number }>;
  toggleLike(dancerId: string, userId: string): Promise<User>;
}

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string[];
  };
}