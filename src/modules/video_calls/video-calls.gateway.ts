import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { IVideoCallsServiceToken, type IVideoCallsService } from './interfaces/video-calls.service.interface';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'video-calls',
})
export class VideoCallsGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('VideoCallsGateway');

  constructor(
    @Inject(IVideoCallsServiceToken)
    private readonly videoCallsService: IVideoCallsService,
  ) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = client.handshake.query.userId as string;
    const roomId = (client as any).roomId;

    if (userId && roomId) {
      this.videoCallsService.recordLeave(roomId, userId).catch(err => this.logger.error(`Error recording leave: ${err.message}`));
      client.to(roomId).emit('user-disconnected', client.id);
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; name?: string; role?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, name, role } = data;
    this.logger.log(`Client ${client.id} (${name}, ${role}) joining room ${roomId}`);
    client.join(roomId);
    (client as any).roomId = roomId;
    (client as any).userName = name;
    (client as any).userRole = role;

    client.to(roomId).emit('user-connected', {
      socketId: client.id,
      name,
      role
    });

    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.videoCallsService.recordJoin(roomId, userId).catch(err => this.logger.error(`Error recording join: ${err.message}`));
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { offer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('offer', {
      offer: data.offer,
      from: client.id,
      name: (client as any).userName,
      role: (client as any).userRole
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { answer: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('answer', {
      answer: data.answer,
      from: client.id,
      name: (client as any).userName,
      role: (client as any).userRole
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { candidate: any; to: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: client.id,
    });
  }

  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @MessageBody() data: { enabled: boolean; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('user-audio-toggle', {
      userId: client.id,
      enabled: data.enabled,
    });
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @MessageBody() data: { enabled: boolean; roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('user-video-toggle', {
      userId: client.id,
      enabled: data.enabled,
    });
  }
}
