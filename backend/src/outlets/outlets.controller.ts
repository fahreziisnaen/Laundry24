import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OutletsService, CreateOutletDto } from './outlets.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Outlets')
@ApiBearerAuth()
@Controller('outlets')
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  @Roles('OWNER')
  @ApiOperation({ summary: 'Create new outlet/branch' })
  create(@Body() dto: CreateOutletDto) { return this.outletsService.create(dto); }

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List all outlets' })
  findAll() { return this.outletsService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get outlet details' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.outletsService.findOne(id); }

  @Patch(':id')
  @Roles('OWNER')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateOutletDto>) {
    return this.outletsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@Param('id', ParseIntPipe) id: number) { return this.outletsService.remove(id); }
}
