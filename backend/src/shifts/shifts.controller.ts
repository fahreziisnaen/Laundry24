import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto, AssignShiftDto } from './dto/shift.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Shifts')
@ApiBearerAuth()
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'List all shifts for outlet' })
  findAll(@CurrentUser() user: any) {
    return this.shiftsService.findAll(user?.outletId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get week schedule assignments' })
  getWeekAssignments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.shiftsService.getWeekAssignments(user.outletId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shift by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a shift' })
  create(@Body() dto: CreateShiftDto, @CurrentUser() user: any) {
    return this.shiftsService.create(dto, user.outletId);
  }

  @Post('assign')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Assign employee to a shift' })
  assign(@Body() dto: AssignShiftDto) {
    return this.shiftsService.assignShift(dto);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update a shift' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShiftDto) {
    return this.shiftsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete a shift' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.shiftsService.remove(id);
  }
}
