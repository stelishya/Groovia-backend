import { User } from 'src/modules/users/models/user.schema';
import { UpdateDancerProfileDto } from '../dto/dancer.dto';
import { Events } from 'src/modules/client/models/events.schema';

export const DancerServiceToken = 'DancerServiceToken';

export interface IDancerService {
    getProfileByUserId(userId: string): Promise<User>;
    uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<{ user: User; imageUrl: string }>;
    uploadCertificate(userId: string, file: Express.Multer.File, certificateName?: string): Promise<any>;
    updateProfile(userId: string, updateData: UpdateDancerProfileDto): Promise<User>;
    getEventRequests(userId: string,options:{ page: number, limit: number, search?: string, status?: string, sortBy?: string}): Promise<{ requests: Events[]; total: number }>;
    toggleLike(dancerId: string, userId: string): Promise<User>;
}