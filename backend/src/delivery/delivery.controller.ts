import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService, CreateDeliveryDto, AssignDriverDto, UpdateDeliveryStatusDto } from './delivery.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Create delivery/pickup task' })
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List delivery tasks' })
  findAll(@CurrentUser() user: any) {
    const driverId = user.role === 'DRIVER' ? user.id : undefined;
    return this.deliveryService.findAll(driverId);
  }

  @Patch(':id/assign')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Assign driver to delivery task' })
  assign(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignDriverDto) {
    return this.deliveryService.assignDriver(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update delivery task status' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveryService.updateStatus(id, dto);
  }
}
