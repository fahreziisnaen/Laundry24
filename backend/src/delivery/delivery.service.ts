import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IsEnum, IsInt, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryStatus, DeliveryType } from '@prisma/client';

export class CreateDeliveryDto {
  @ApiProperty() @IsInt() orderId: number;
  @ApiProperty({ enum: ['PICKUP', 'DELIVERY'] }) @IsEnum(['PICKUP', 'DELIVERY']) type: DeliveryType;
  @ApiProperty() @IsString() address: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
}

export class AssignDriverDto {
  @ApiProperty() @IsInt() driverId: number;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: ['PENDING','ASSIGNED','ON_WAY','DONE','FAILED'] })
  @IsEnum(['PENDING','ASSIGNED','ON_WAY','DONE','FAILED'])
  status: DeliveryStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateDeliveryDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.deliveryTask.create({
      data: {
        orderId: dto.orderId,
        type: dto.type,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: { order: { select: { orderNumber: true } } },
    });
  }

  async findAll(driverId?: number) {
    return this.prisma.deliveryTask.findMany({
      where: { ...(driverId && { driverId }) },
      include: {
        order: { select: { orderNumber: true, customer: { select: { name: true, phone: true } } } },
        driver: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async assignDriver(taskId: number, dto: AssignDriverDto) {
    const task = await this.prisma.deliveryTask.findUnique({ where: { id: taskId }, include: { order: true } });
    if (!task) throw new NotFoundException('Delivery task not found');

    const updated = await this.prisma.deliveryTask.update({
      where: { id: taskId },
      data: { driverId: dto.driverId, status: 'ASSIGNED' },
    });

    await this.notifications.send({
      customerId: task.order.customerId,
      type: 'ORDER_STATUS',
      title: 'Driver Ditugaskan',
      body: `Driver sedang dalam perjalanan untuk pesanan #${task.order.orderNumber}`,
      data: { orderId: task.orderId },
    });

    return updated;
  }

  async updateStatus(taskId: number, dto: UpdateDeliveryStatusDto) {
    const task = await this.prisma.deliveryTask.findUnique({ where: { id: taskId }, include: { order: true } });
    if (!task) throw new NotFoundException('Delivery task not found');

    const data: any = { status: dto.status, notes: dto.notes };
    if (dto.status === 'ON_WAY') data.startedAt = new Date();
    if (dto.status === 'DONE') data.completedAt = new Date();

    const updated = await this.prisma.deliveryTask.update({ where: { id: taskId }, data });

    if (dto.status === 'DONE') {
      await this.prisma.order.update({
        where: { id: task.orderId },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });

      await this.notifications.send({
        customerId: task.order.customerId,
        type: 'ORDER_STATUS',
        title: 'Pesanan Terkirim!',
        body: `Pesanan #${task.order.orderNumber} telah diterima. Terima kasih!`,
        data: { orderId: task.orderId },
      });
    }

    return updated;
  }
}
