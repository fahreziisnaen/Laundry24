import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto, AttendanceQueryDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: AttendanceQueryDto, outletId?: number) {
    const { page = 1, limit = 20, employeeId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (outletId) where.employee = { outletId };
    if (startDate || endDate) {
      where.checkInAt = {};
      if (startDate) where.checkInAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.checkInAt.lte = end;
      }
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
        include: {
          employee: { include: { user: { select: { name: true } } } },
          shift: { select: { name: true, startTime: true, endTime: true } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getTodaySummary(outletId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [present, late, absent] = await this.prisma.$transaction([
      this.prisma.attendance.count({
        where: { status: 'PRESENT', checkInAt: { gte: today, lt: tomorrow }, employee: { outletId } },
      }),
      this.prisma.attendance.count({
        where: { status: 'LATE', checkInAt: { gte: today, lt: tomorrow }, employee: { outletId } },
      }),
      this.prisma.attendance.count({
        where: { status: 'ABSENT', checkInAt: { gte: today, lt: tomorrow }, employee: { outletId } },
      }),
    ]);

    return { present, late, absent };
  }

  async checkIn(userId: number, dto: CheckInDto) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee record not found for this user');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.attendance.findFirst({
      where: { employeeId: employee.id, checkInAt: { gte: today, lt: tomorrow } },
    });
    if (existing) throw new BadRequestException('Already checked in today');

    // Determine if late based on shift
    let status: 'PRESENT' | 'LATE' = 'PRESENT';
    if (dto.shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: dto.shiftId } });
      if (shift) {
        const [h, m] = shift.startTime.split(':').map(Number);
        const shiftStart = new Date();
        shiftStart.setHours(h, m, 0, 0);
        const lateThreshold = new Date(shiftStart.getTime() + 15 * 60 * 1000); // 15 min grace
        if (new Date() > lateThreshold) status = 'LATE';
      }
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: employee.id,
        shiftId: dto.shiftId,
        checkInAt: new Date(),
        checkInLat: dto.checkInLat,
        checkInLng: dto.checkInLng,
        status,
        notes: dto.notes,
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        shift: true,
      },
    });
  }

  async checkOut(userId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new NotFoundException('Employee record not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        checkInAt: { gte: today, lt: tomorrow },
        checkOutAt: null,
      },
    });
    if (!attendance) throw new BadRequestException('No active check-in found');

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutAt: new Date(),
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        shift: true,
      },
    });
  }
}
