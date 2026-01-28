export interface SessionAuthToken {
  roomId: string;
  userId: string;
  role: string;
  timestamp: number;
}

export interface SessionResponse {
  sessionId: string;
  token: string;
  status?: string;
}

export interface ServiceOperationResult {
  success: boolean;
}