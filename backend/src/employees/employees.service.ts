import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsEmail, IsNumber, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, AttendanceStatus } from '@prisma/client';
import * as dayjs from 'dayjs';

export class CreateEmployeeDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() password: string;
  @ApiProperty() @IsNumber() roleId: number;
  @ApiProperty() @IsNumber() outletId: number;
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
  @ApiProperty() @IsDateString() hireDate: string;
  @ApiProperty() @IsNumber() @Min(0) baseSalary: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankAccount?: string;
}

export class CheckInDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() shiftId?: number;
  @ApiPropertyOptional() @IsOptional() lat?: number;
  @ApiPropertyOptional() @IsOptional() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional() @IsOptional() lat?: number;
  @ApiPropertyOptional() @IsOptional() lng?: number;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() position?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) baseSalary?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankAccount?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  // User fields
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
}

export class GeneratePayrollDto {
  @ApiProperty({ example: '2024-01-01' }) @IsDateString() periodStart: string;
  @ApiProperty({ example: '2024-01-31' }) @IsDateString() periodEnd: string;
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const empCode = await this.generateEmployeeCode(dto.outletId);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash: await bcrypt.hash(dto.password, 12),
          roleId: dto.roleId,
          outletId: dto.outletId,
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          outletId: dto.outletId,
          employeeCode: empCode,
          position: dto.position,
          hireDate: new Date(dto.hireDate),
          baseSalary: dto.baseSalary,
          bankName: dto.bankName,
          bankAccount: dto.bankAccount,
        },
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    });
  }

  async findAll(outletId?: number) {
    return this.prisma.employee.findMany({
      where: { ...(outletId && { outletId }), isActive: true },
      include: {
        user: { select: { name: true, email: true, phone: true, role: true, avatarUrl: true } },
        outlet: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');

    const { name, phone, ...empFields } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (name || phone) {
        await tx.user.update({
          where: { id: emp.userId },
          data: { ...(name && { name }), ...(phone && { phone }) },
        });
      }
      return tx.employee.update({
        where: { id },
        data: empFields,
        include: { user: { select: { name: true, email: true, phone: true } } },
      });
    });
  }

  async deactivate(id: number) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.employee.update({ where: { id }, data: { isActive: false } });
  }

  async findOne(id: number) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true, role: true } },
        outlet: { select: { name: true } },
        attendance: { take: 30, orderBy: { checkInAt: 'desc' } },
        payrolls: { take: 12, orderBy: { periodStart: 'desc' } },
      },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  // ── Attendance: Check-in ─────────────────────────────────────
  async checkIn(employeeId: number, dto: CheckInDto) {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        checkInAt: { gte: today, lte: tomorrow },
      },
    });
    if (existing) throw new ConflictException('Already checked in today');

    // Determine if late based on shift
    let status: AttendanceStatus = 'PRESENT';
    if (dto.shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: dto.shiftId } });
      if (shift) {
        const [h, m] = shift.startTime.split(':').map(Number);
        const shiftStart = dayjs().hour(h).minute(m);
        if (dayjs().isAfter(shiftStart.add(15, 'minute'))) status = 'LATE';
      }
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        shiftId: dto.shiftId,
        checkInAt: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        status,
        notes: dto.notes,
      },
    });
  }

  // ── Attendance: Check-out ────────────────────────────────────
  async checkOut(employeeId: number, dto: CheckOutDto) {
    const today = dayjs().startOf('day').toDate();
    const record = await this.prisma.attendance.findFirst({
      where: { employeeId, checkInAt: { gte: today }, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });
    if (!record) throw new NotFoundException('No active check-in found');

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutAt: new Date(),
        checkOutLat: dto.lat,
        checkOutLng: dto.lng,
      },
    });
  }

  // ── Get payroll list ─────────────────────────────────────────
  async getPayroll(outletId: number, periodStart: string, periodEnd: string) {
    return this.prisma.payroll.findMany({
      where: {
        employee: { outletId },
        periodStart: { gte: new Date(periodStart) },
        periodEnd:   { lte: new Date(periodEnd) },
      },
      include: {
        employee: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Generate payroll ─────────────────────────────────────────
  async generatePayroll(dto: GeneratePayrollDto, outletId: number) {
    const employees = await this.prisma.employee.findMany({
      where: { outletId, isActive: true },
    });

    const results = await Promise.all(
      employees.map(async (emp) => {
        const start = new Date(dto.periodStart);
        const end = new Date(dto.periodEnd);

        const attendanceRecords = await this.prisma.attendance.findMany({
          where: {
            employeeId: emp.id,
            checkInAt: { gte: start, lte: end },
          },
        });

        const presentDays = attendanceRecords.filter(
          (a) => a.status === 'PRESENT' || a.status === 'LATE',
        ).length;

        // Simple calculation: pro-rated based on working days
        const workingDays = dayjs(end).diff(dayjs(start), 'day') + 1;
        const netSalary = (Number(emp.baseSalary) / workingDays) * presentDays;

        const existing = await this.prisma.payroll.findFirst({
          where: { employeeId: emp.id, periodStart: start, periodEnd: end },
        });
        if (existing) {
          return this.prisma.payroll.update({
            where: { id: existing.id },
            data: { presentDays, netSalary },
          });
        }
        return this.prisma.payroll.create({
          data: {
            employeeId: emp.id,
            periodStart: start,
            periodEnd: end,
            workingDays,
            presentDays,
            baseSalary: emp.baseSalary,
            netSalary,
          },
        });
      }),
    );

    return results;
  }

  private async generateEmployeeCode(outletId: number): Promise<string> {
    const count = await this.prisma.employee.count({ where: { outletId } });
    return `EMP-${outletId}-${String(count + 1).padStart(4, '0')}`;
  }
}
