import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: number) {
    return this.prisma.shift.findMany({
      where: outletId ? { outletId } : undefined,
      include: {
        shiftAssignments: {
          include: {
            employee: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { workDate: 'desc' },
          take: 50,
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: number) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async create(dto: CreateShiftDto, outletId: number) {
    return this.prisma.shift.create({
      data: { ...dto, outletId },
    });
  }

  async update(id: number, dto: UpdateShiftDto) {
    await this.findOne(id);
    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.shift.delete({ where: { id } });
  }

  async assignShift(dto: AssignShiftDto) {
    return this.prisma.shiftAssignment.upsert({
      where: {
        employeeId_workDate: {
          employeeId: dto.employeeId,
          workDate: new Date(dto.workDate),
        },
      },
      update: { shiftId: dto.shiftId },
      create: {
        employeeId: dto.employeeId,
        shiftId: dto.shiftId,
        workDate: new Date(dto.workDate),
      },
    });
  }

  async getWeekAssignments(outletId: number, startDate: string, endDate: string) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        workDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        employee: { outletId },
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        shift: true,
      },
      orderBy: { workDate: 'asc' },
    });
  }
}
