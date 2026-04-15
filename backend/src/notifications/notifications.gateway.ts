import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwt: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string;
    if (!token) { client.disconnect(); return; }

    try {
      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      client.data.user = payload;

      // Join outlet-specific room and user room
      if (payload.userId)   client.join(`user:${payload.userId}`);
      if (payload.outletId) client.join(`outlet:${payload.outletId}`);
      if (payload.customerId) client.join(`customer:${payload.customerId}`);

      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Emit to specific customer */
  emitToCustomer(customerId: number, event: string, data: any) {
    this.server.to(`customer:${customerId}`).emit(event, data);
  }

  /** Emit to all clients in an outlet */
  emitToOutlet(outletId: number, event: string, data: any) {
    this.server.to(`outlet:${outletId}`).emit(event, data);
  }

  /** Broadcast to all connected clients */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
