import { Socket } from "socket.io";
import { ServiceOperationResult, SessionAuthToken, SessionResponse } from "../dto/video-call.dto";
import { Types } from "mongoose";

export const IVideoCallsServiceToken = Symbol('IVideoCallsService');

export interface IVideoCallsService {
  startSession(
    sessionId: string,
    userId: string,
    type: 'workshop' | 'competition',
  ): Promise<SessionResponse>;

  joinSession(
    sessionId: string,
    userId: string,
    type: 'workshop' | 'competition',
  ): Promise<SessionResponse>;

  validateToken(token: string): SessionAuthToken | null;

  recordJoin(workshopId: string, userId: string): Promise<ServiceOperationResult>;
  recordLeave(workshopId: string, userId: string): Promise<ServiceOperationResult>;
}

export interface AuthenticatedSocket extends Socket {
  roomId?: string;
  userName?: string;
  userRole?: string;
}

// WebRTC Signal Types
export interface WebRTCSignal {
  type: string;
  sdp?: string;
  [key: string]: unknown;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

export interface AttendanceRecord {
  dancerId: Types.ObjectId;
  joinTime: Date;
  leaveTime?: Date;
  duration: number;
  status: string;
}

export interface Participant {
  dancerId: Types.ObjectId;
  paymentStatus: string;
}