import {
    BadRequestException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { type IWorkshopService, IWorkshopServiceToken } from '../workshops/interfaces/workshop.service.interface';
import { type ICompetitionService, ICompetitionServiceToken } from '../competitions/interfaces/competition.service.interface';
import { Types } from 'mongoose';
import { IVideoCallsService } from './interfaces/video-calls.service.interface';

@Injectable()
export class VideoCallsService implements IVideoCallsService {
    constructor(
        @Inject(IWorkshopServiceToken)
        private readonly workshopService: IWorkshopService,
        @Inject(ICompetitionServiceToken)
        private readonly competitionService: ICompetitionService,
    ) { }

    async startSession(
        sessionId: string,
        userId: string,
        type: 'workshop' | 'competition',
    ) {
        if (type === 'workshop') {
            return this.startWorkshopSession(sessionId, userId);
        } else {
            // TODO: Implement competition session start logic
            throw new BadRequestException('Competition video calls not implemented yet');
        }
    }

    private async startWorkshopSession(workshopId: string, instructorId: string) {
        const workshop = await this.workshopService.findOne(workshopId);

        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        if (workshop.instructor._id.toString() !== instructorId) {
            throw new UnauthorizedException(
                'Only the instructor can start this session',
            );
        }

        // Check time window (15 mins before start)
        const now = new Date();
        const startTime = new Date(workshop.startDate); // Assuming startDate holds the session time
        const timeDiff = startTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);

        // Allow start if within 15 mins before or if already passed (but not too late? - Logic can be refined)
        // if (minutesDiff > 15) {
        //     throw new BadRequestException(
        //         'Session can only be started 15 minutes before the scheduled time',
        //     );
        // }

        // TODO: Ideally we should update the workshop status to 'LIVE' here.
        // However, IWorkshopService might not expose a direct "updateStatus" method.
        // For now, we return a success token/room signal.
        // Real implementation would require updating the Workshop model via the service/repo.

        return {
            sessionId: workshopId,
            token: this.generateToken(workshopId, instructorId, 'instructor'),
            status: 'LIVE',
        };
    }

    async joinSession(
        sessionId: string,
        userId: string,
        type: 'workshop' | 'competition',
    ) {
        if (type === 'workshop') {
            return this.joinWorkshopSession(sessionId, userId);
        }
        throw new BadRequestException('Competition video calls not implemented yet');
    }

    private async joinWorkshopSession(workshopId: string, userId: string) {
        const workshop = await this.workshopService.findOne(workshopId);
        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Check if user is instructor
        if (workshop.instructor._id.toString() === userId) {
            return {
                sessionId: workshopId,
                token: this.generateToken(workshopId, userId, 'instructor'),
            };
        }

        // Check if user is enrolled participant
        const isEnrolled = workshop.participants.some(
            (p: any) =>
                p.dancerId.toString() === userId && p.paymentStatus === 'paid',
        );

        if (!isEnrolled) {
            throw new UnauthorizedException(
                'You are not enrolled in this workshop session',
            );
        }

        return {
            sessionId: workshopId,
            token: this.generateToken(workshopId, userId, 'dancer'),
        };
    }

    private generateToken(roomId: string, userId: string, role: string) {
        // In a real app, sign a JWT or similar.
        // For this prototype, we'll return a plain object base64 encoded or just a structured string.
        return Buffer.from(
            JSON.stringify({ roomId, userId, role, timestamp: Date.now() }),
        ).toString('base64');
    }

    async recordJoin(workshopId: string, userId: string) {
        const workshop = await this.workshopService.findOne(workshopId);
        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Check if user already has a pending record
        const existingRecord = (workshop as any).attendanceRecords?.find(
            (record: any) => record.dancerId.toString() === userId && !record.leaveTime
        );

        if (existingRecord) {
            // User rejoining - update join time
            existingRecord.joinTime = new Date();
            existingRecord.status = 'pending';
        } else {
            // New join record
            if (!(workshop as any).attendanceRecords) {
                (workshop as any).attendanceRecords = [];
            }
            (workshop as any).attendanceRecords.push({
                dancerId: new Types.ObjectId(userId),
                joinTime: new Date(),
                leaveTime: null,
                duration: 0,
                status: 'pending',
            });
        }

        await (workshop as any).save();
        return { success: true };
    }

    async recordLeave(workshopId: string, userId: string) {
        const workshop = await this.workshopService.findOne(workshopId);
        if (!workshop) {
            throw new NotFoundException('Workshop not found');
        }

        // Find the active attendance record
        const record = (workshop as any).attendanceRecords?.find(
            (r: any) => r.dancerId.toString() === userId && !r.leaveTime
        );

        if (record) {
            record.leaveTime = new Date();
            const durationMs = record.leaveTime.getTime() - record.joinTime.getTime();
            record.duration = Math.floor(durationMs / (1000 * 60)); // Convert to minutes

            // Calculate workshop duration
            const workshopDurationMs = new Date(workshop.endDate).getTime() - new Date(workshop.startDate).getTime();
            const workshopDurationMinutes = workshopDurationMs / (1000 * 60);

            // Calculate attendance (70% threshold)
            const attendancePercentage = (record.duration / workshopDurationMinutes) * 100;
            record.status = attendancePercentage >= 70 ? 'present' : 'absent';

            await (workshop as any).save();
        }

        return { success: true };
    }

    validateToken(token: string) {
        try {
            const decoded = JSON.parse(
                Buffer.from(token, 'base64').toString('utf-8'),
            );
            // Valid if timestamp is recent (e.g. within 2 hours)
            // For now, strict validation omitted for brevity
            return decoded;
        } catch (e) {
            return null;
        }
    }
}
