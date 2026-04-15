import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService, CreateEmployeeDto, CheckInDto, CheckOutDto, GeneratePayrollDto } from './employees.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create employee account' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List employees' })
  findAll(@CurrentUser() user: any) {
    return this.employeesService.findAll(user.role !== 'OWNER' ? user.outletId : undefined);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get employee details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Employee check-in' })
  checkIn(@Param('id', ParseIntPipe) id: number, @Body() dto: CheckInDto) {
    return this.employeesService.checkIn(id, dto);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Employee check-out' })
  checkOut(@Param('id', ParseIntPipe) id: number, @Body() dto: CheckOutDto) {
    return this.employeesService.checkOut(id, dto);
  }

  @Post('payroll/generate')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Generate payroll for an outlet' })
  generatePayroll(@Body() dto: GeneratePayrollDto) {
    return this.employeesService.generatePayroll(dto);
  }
}
