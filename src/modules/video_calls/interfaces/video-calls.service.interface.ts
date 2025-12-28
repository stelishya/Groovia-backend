export const IVideoCallsServiceToken = Symbol('IVideoCallsService')

export interface IVideoCallsService {
    startSession(
        sessionId: string,
        userId: string,
        type: 'workshop' | 'competition',
    ): Promise<any>;

    joinSession(
        sessionId: string,
        userId: string,
        type: 'workshop' | 'competition',
    ): Promise<any>;

    validateToken(token: string): any;

    recordJoin(workshopId: string, userId: string): Promise<any>;
    recordLeave(workshopId: string, userId: string): Promise<any>;
}
