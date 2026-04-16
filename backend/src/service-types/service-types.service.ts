import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';

@Injectable()
export class ServiceTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: number, activeOnly = true) {
    return this.prisma.serviceType.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(outletId ? { OR: [{ outletId }, { outletId: null }] } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const st = await this.prisma.serviceType.findUnique({ where: { id } });
    if (!st) throw new NotFoundException('Service type not found');
    return st;
  }

  async create(dto: CreateServiceTypeDto, outletId?: number) {
    const existing = await this.prisma.serviceType.findFirst({
      where: { code: dto.code, ...(outletId ? { outletId } : {}) },
    });
    if (existing) throw new ConflictException(`Service type with code "${dto.code}" already exists`);

    return this.prisma.serviceType.create({
      data: {
        name: dto.name,
        code: dto.code,
        basePrice: dto.basePrice,
        unit: dto.unit ?? 'kg',
        slaHours: dto.slaHours ?? 24,
        outletId: outletId ?? null,
      },
    });
  }

  async update(id: number, dto: UpdateServiceTypeDto) {
    await this.findOne(id);
    return this.prisma.serviceType.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
