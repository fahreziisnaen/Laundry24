import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CheckInDto, AttendanceQueryDto } from './dto/attendance.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'List attendance records' })
  findAll(@Query() query: AttendanceQueryDto, @CurrentUser() user: any) {
    return this.attendanceService.findAll(query, user?.outletId);
  }

  @Get('today-summary')
  @ApiOperation({ summary: 'Get today attendance summary counts' })
  todaySummary(@CurrentUser() user: any) {
    return this.attendanceService.getTodaySummary(user.outletId);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Employee check-in' })
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: any) {
    return this.attendanceService.checkIn(user.id, dto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Employee check-out' })
  checkOut(@CurrentUser() user: any) {
    return this.attendanceService.checkOut(user.id);
  }
}
