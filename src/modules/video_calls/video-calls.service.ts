import { Types } from 'mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  type IWorkshopService,
  IWorkshopServiceToken,
} from '../workshops/interfaces/workshop.service.interface';
import {
  type ICompetitionService,
  ICompetitionServiceToken,
} from '../competitions/interfaces/competition.service.interface';
import {
  AttendanceRecord,
  IVideoCallsService,
} from './interfaces/video-calls.service.interface';
import {
  ServiceOperationResult,
  SessionAuthToken,
  SessionResponse,
} from './dto/video-call.dto';
import { WorkshopDocument } from '../workshops/models/workshop.schema';
import { Participant } from './interfaces/video-calls.service.interface';

@Injectable()
export class VideoCallsService implements IVideoCallsService {
  constructor(
    @Inject(IWorkshopServiceToken)
    private readonly workshopService: IWorkshopService,
    @Inject(ICompetitionServiceToken)
    private readonly competitionService: ICompetitionService,
  ) {}

  async startSession(
    sessionId: string,
    userId: string,
    type: 'workshop' | 'competition',
  ): Promise<SessionResponse> {
    if (type === 'workshop') {
      return this.startWorkshopSession(sessionId, userId);
    } else {
      throw new BadRequestException('Competition video calls not implemented');
    }
  }

  private async startWorkshopSession(
    workshopId: string,
    instructorId: string,
  ): Promise<SessionResponse> {
    const workshop = (await this.workshopService.findOne(
      workshopId,
    )) as WorkshopDocument;

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Handle instructor ID check safely
    const workshopInstructorId =
      workshop.instructor instanceof Types.ObjectId
        ? workshop.instructor.toString()
        : (workshop.instructor as unknown as Types.ObjectId)._id.toString();

    if (workshopInstructorId !== instructorId) {
      throw new UnauthorizedException(
        'Only the instructor can start this session',
      );
    }

    // Check time window (15 mins before start)
    const now = new Date();
    const startTime = new Date(workshop.startDate);
    const timeDiff = startTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // if (minutesDiff > 15) {
    //     throw new BadRequestException(
    //         'Session can only be started 15 minutes before the scheduled time',
    //     );
    // }

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
  ): Promise<SessionResponse> {
    if (type === 'workshop') {
      return this.joinWorkshopSession(sessionId, userId);
    }
    throw new BadRequestException('Competition video calls not implemented');
  }

  private async joinWorkshopSession(
    workshopId: string,
    userId: string,
  ): Promise<SessionResponse> {
    const workshop = (await this.workshopService.findOne(
      workshopId,
    )) as WorkshopDocument;
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Handle instructor ID check safely
    const workshopInstructorId =
      workshop.instructor instanceof Types.ObjectId
        ? workshop.instructor.toString()
        : (workshop.instructor as unknown as Types.ObjectId)._id.toString();

    // Check if user is instructor
    if (workshopInstructorId === userId) {
      return {
        sessionId: workshopId,
        token: this.generateToken(workshopId, userId, 'instructor'),
      };
    }

    // Check if user is enrolled participant
    //cast participants to the interface Participant
    const participants = workshop.participants as unknown as Participant[];

    const isEnrolled = participants.some(
      (p) => p.dancerId.toString() === userId && p.paymentStatus === 'paid',
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

  private generateToken(roomId: string, userId: string, role: string): string {
    // In a real app, sign a JWT or similar.
    // For this prototype, we'll return a plain object base64 encoded or just a structured string.
    const payload: SessionAuthToken = {
      roomId,
      userId,
      role,
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  async recordJoin(
    workshopId: string,
    userId: string,
  ): Promise<ServiceOperationResult> {
    const workshop = (await this.workshopService.findOne(
      workshopId,
    )) as WorkshopDocument;
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Ensure attendanceRecords array exists
    if (!workshop.attendanceRecords) {
      workshop.attendanceRecords = [];
    }

    // Typed search
    const records = workshop.attendanceRecords as unknown as AttendanceRecord[];

    // Check if user already has a pending record
    const existingRecord = records.find(
      (record: AttendanceRecord) =>
        record.dancerId.toString() === userId && !record.leaveTime,
    );

    if (existingRecord) {
      // User rejoining - update join time
      existingRecord.joinTime = new Date();
      existingRecord.status = 'pending';
    } else {
      // if (!workshop.attendanceRecords) {
      //   workshop.attendanceRecords = [];
      // }
      workshop.attendanceRecords.push({
        dancerId: new Types.ObjectId(userId),
        joinTime: new Date(),
        leaveTime: undefined,
        duration: 0,
        status: 'pending',
      });
    }

    await workshop.save();
    return { success: true };
  }

  async recordLeave(
    workshopId: string,
    userId: string,
  ): Promise<ServiceOperationResult> {
    const workshop = (await this.workshopService.findOne(
      workshopId,
    )) as WorkshopDocument;
    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (!workshop.attendanceRecords) {
      return { success: true };
    }

    const records = workshop.attendanceRecords as unknown as AttendanceRecord[];

    // Find the active attendance record
    const record = records.find(
      (r) => r.dancerId.toString() === userId && !r.leaveTime,
    );

    if (record) {
      record.leaveTime = new Date();
      const durationMs = record.leaveTime.getTime() - record.joinTime.getTime();
      record.duration = Math.floor(durationMs / (1000 * 60)); // Convert to minutes

      // Calculate workshop duration
      const workshopDurationMs =
        new Date(workshop.endDate).getTime() -
        new Date(workshop.startDate).getTime();
      const workshopDurationMinutes = workshopDurationMs / (1000 * 60);

      // Calculate attendance (70% threshold)
      const attendancePercentage =
        (record.duration / workshopDurationMinutes) * 100;
      record.status = attendancePercentage >= 70 ? 'present' : 'absent';

      await workshop.save();
    }

    return { success: true };
  }

  validateToken(token: string): SessionAuthToken | null {
    try {
      const decoded = JSON.parse(
        Buffer.from(token, 'base64').toString('utf-8'),
      ) as SessionAuthToken;
      // Valid if timestamp is recent (e.g. within 2 hours)
      // For now, strict validation omitted for brevity
      return decoded;
    } catch (e) {
      return null;
    }
  }
}
