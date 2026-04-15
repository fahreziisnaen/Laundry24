import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { IsEnum, IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MachineStatus, MachineType, MachineEvent } from '@prisma/client';

export class CreateMachineDto {
  @ApiProperty() @IsInt() outletId: number;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['WASHER','DRYER','IRON'] }) @IsEnum(['WASHER','DRYER','IRON']) type: MachineType;
  @ApiProperty() @IsNumber() capacityKg: number;
  @ApiPropertyOptional() @IsOptional() @IsString() nfcUid?: string;
}

export class MachinePingDto {
  @ApiProperty({ enum: ['IDLE','RUNNING','MAINTENANCE','OFFLINE'] })
  @IsEnum(['IDLE','RUNNING','MAINTENANCE','OFFLINE'])
  status: MachineStatus;

  @ApiPropertyOptional() @IsOptional() @IsInt() orderId?: number;
  @ApiPropertyOptional() details?: Record<string, any>;
}

@Injectable()
export class IotService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createMachine(dto: CreateMachineDto) {
    return this.prisma.machine.create({ data: { ...dto } });
  }

  async getMachines(outletId: number) {
    return this.prisma.machine.findMany({
      where: { outletId },
      include: {
        logs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /** Simulate machine ping (IoT device status update) */
  async ping(machineId: number, dto: MachinePingDto, userId?: number) {
    const machine = await this.prisma.machine.findUnique({ where: { id: machineId } });
    if (!machine) throw new NotFoundException('Machine not found');

    const event: MachineEvent =
      dto.status === 'RUNNING' ? 'START'
      : dto.status === 'IDLE' ? 'STOP'
      : dto.status === 'MAINTENANCE' ? 'MAINTENANCE'
      : 'FAULT';

    const [updated, log] = await this.prisma.$transaction([
      this.prisma.machine.update({
        where: { id: machineId },
        data: { status: dto.status, lastPingAt: new Date() },
      }),
      this.prisma.machineLog.create({
        data: {
          machineId,
          orderId: dto.orderId,
          userId,
          event,
          details: dto.details,
        },
      }),
    ]);

    // Emit real-time update to outlet staff
    this.gateway.emitToOutlet(machine.outletId, 'machine:update', {
      machineId,
      name: machine.name,
      status: dto.status,
      timestamp: new Date(),
    });

    return { machine: updated, log };
  }

  /** NFC card simulation: assign machine to order */
  async nfcScan(nfcUid: string, orderId: number) {
    const machine = await this.prisma.machine.findFirst({ where: { nfcUid } });
    if (!machine) throw new NotFoundException('Machine with this NFC UID not found');

    return this.ping(machine.id, {
      status: 'RUNNING',
      orderId,
      details: { trigger: 'NFC', nfcUid },
    });
  }

  async getMachineLogs(machineId: number) {
    return this.prisma.machineLog.findMany({
      where: { machineId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        order: { select: { orderNumber: true } },
        user:  { select: { name: true } },
      },
    });
  }
}
