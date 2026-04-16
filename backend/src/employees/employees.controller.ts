import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  EmployeesService,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CheckInDto,
  CheckOutDto,
  GeneratePayrollDto,
} from './employees.service';
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

  @Get('payroll')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get payroll records for a period' })
  getPayroll(
    @CurrentUser() user: any,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    return this.employeesService.getPayroll(user.outletId, periodStart, periodEnd);
  }

  @Post('payroll/generate')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Generate payroll for the outlet' })
  generatePayroll(@Body() dto: GeneratePayrollDto, @CurrentUser() user: any) {
    return this.employeesService.generatePayroll(dto, user.outletId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get employee details' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update employee' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Deactivate employee' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.deactivate(id);
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
}
