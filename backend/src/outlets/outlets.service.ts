import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOutletDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
}

@Injectable()
export class OutletsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateOutletDto) {
    return this.prisma.outlet.create({ data: dto });
  }

  findAll() {
    return this.prisma.outlet.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { orders: true, employees: true, customers: true } },
      },
    });
  }

  async findOne(id: number) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { orders: true, employees: true } },
      },
    });
    if (!outlet) throw new NotFoundException('Outlet not found');
    return outlet;
  }

  update(id: number, dto: Partial<CreateOutletDto>) {
    return this.prisma.outlet.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.outlet.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
