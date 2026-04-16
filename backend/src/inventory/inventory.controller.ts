import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService, CreateInventoryItemDto, UpdateInventoryItemDto, AdjustStockDto } from './inventory.service';
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
  findAll(@CurrentUser() user: any, @Query('lowStock') lowStock?: string, @Query('outletId') outletId?: string) {
    const id = outletId ? parseInt(outletId) : user.outletId;
    if (lowStock === 'true') return this.inventoryService.findLowStock(id);
    return this.inventoryService.findAll(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update inventory item details' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
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
