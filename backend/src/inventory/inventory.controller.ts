import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService, CreateInventoryItemDto, AdjustStockDto } from './inventory.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Add inventory item' })
  create(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List inventory items' })
  findAll(@CurrentUser() user: any, @Query('outletId') outletId?: string) {
    const id = outletId ? parseInt(outletId) : user.outletId;
    return this.inventoryService.findAll(id);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low-stock items' })
  lowStock(@CurrentUser() user: any) {
    return this.inventoryService.findLowStock(user.outletId);
  }

  @Post(':id/adjust')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Adjust stock (in / out / correction)' })
  adjust(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.adjustStock(id, dto, user.id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get stock movement logs' })
  logs(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getLogs(id);
  }
}
