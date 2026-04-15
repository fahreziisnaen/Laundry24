import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryCategory, InvLogType, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

export class CreateInventoryItemDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['DETERGENT','SOFTENER','PERFUME','PLASTIC','HANGER','OTHER'] })
  @IsEnum(['DETERGENT','SOFTENER','PERFUME','PLASTIC','HANGER','OTHER'])
  category: InventoryCategory;
  @ApiProperty() @IsNumber() outletId: number;
  @ApiProperty({ default: 'pcs' }) @IsOptional() @IsString() unit?: string;
  @ApiProperty({ default: 0 }) @IsNumber() @Min(0) stock: number;
  @ApiProperty({ description: 'Low stock threshold' }) @IsNumber() @Min(0) minStock: number;
  @ApiProperty() @IsNumber() @Min(0) costPerUnit: number;
}

export class AdjustStockDto {
  @ApiProperty({ enum: ['IN','OUT','ADJUSTMENT'] })
  @IsEnum(['IN','OUT','ADJUSTMENT'])
  type: InvLogType;

  @ApiProperty() @IsNumber() @Min(0) quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({ data: { ...dto } });
  }

  async findAll(outletId: number) {
    return this.prisma.inventoryItem.findMany({
      where: { outletId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findLowStock(outletId: number) {
    return this.prisma.inventoryItem.findMany({
      where: {
        outletId,
        isActive: true,
        stock: { lte: this.prisma.inventoryItem.fields.minStock as any },
      },
    });
  }

  async adjustStock(itemId: number, dto: AdjustStockDto, userId?: number, orderId?: number) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const before = Number(item.stock);
    let after: number;

    if (dto.type === 'IN') {
      after = before + dto.quantity;
    } else if (dto.type === 'OUT') {
      if (before < dto.quantity) throw new BadRequestException('Insufficient stock');
      after = before - dto.quantity;
    } else {
      after = dto.quantity; // direct adjustment
    }

    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { stock: after },
      }),
      this.prisma.inventoryLog.create({
        data: {
          itemId,
          userId,
          orderId,
          type: dto.type,
          quantity: dto.quantity,
          stockBefore: before,
          stockAfter: after,
          notes: dto.notes,
        },
      }),
    ]);

    return { itemId, stockBefore: before, stockAfter: after };
  }

  async getLogs(itemId: number) {
    return this.prisma.inventoryLog.findMany({
      where: { itemId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } },
    });
  }

  /** Scheduled: check low-stock every morning */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowStockAlert() {
    const items = await this.prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: { outlet: { select: { name: true } } },
    });

    for (const item of items) {
      if (Number(item.stock) <= Number(item.minStock)) {
        this.logger.warn(
          `LOW STOCK: ${item.name} (${item.outlet.name}) — ${item.stock} ${item.unit} remaining`,
        );
        // In production: send alert notification to outlet admin
      }
    }
  }
}
