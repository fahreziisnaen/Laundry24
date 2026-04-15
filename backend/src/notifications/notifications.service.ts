import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotifType, NotifChannel } from '@prisma/client';

interface SendNotifDto {
  customerId?: number;
  userId?: number;
  outletId?: number;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: NotifChannel;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async send(dto: SendNotifDto) {
    // Persist notification
    const notification = await this.prisma.notification.create({
      data: {
        customerId: dto.customerId,
        userId: dto.userId,
        outletId: dto.outletId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        channel: dto.channel ?? 'IN_APP',
        sentAt: new Date(),
      },
    });

    // Push via Socket.IO
    if (dto.customerId) {
      this.gateway.emitToCustomer(dto.customerId, 'notification', {
        id: notification.id,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        type: dto.type,
      });
    }

    if (dto.outletId) {
      this.gateway.emitToOutlet(dto.outletId, 'notification', {
        id: notification.id,
        title: dto.title,
        body: dto.body,
        type: dto.type,
      });
    }

    // WhatsApp mock
    if (dto.channel === 'WHATSAPP' && dto.customerId) {
      await this.sendWhatsAppMock(dto.customerId, dto.body);
    }

    return notification;
  }

  async getUnread(userId?: number, customerId?: number) {
    return this.prisma.notification.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(customerId ? [{ customerId }] : []),
        ],
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAllRead(userId?: number, customerId?: number) {
    return this.prisma.notification.updateMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(customerId ? [{ customerId }] : []),
        ],
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /** Mock WhatsApp API call */
  private async sendWhatsAppMock(customerId: number, message: string) {
    this.logger.log(`[WhatsApp Mock] CustomerID:${customerId} → ${message}`);
    // In production: call a real WhatsApp Business API (e.g., Fonnte, Wablas, etc.)
  }
}
