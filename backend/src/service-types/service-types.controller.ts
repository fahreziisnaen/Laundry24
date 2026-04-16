import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto, UpdateServiceTypeDto } from './dto/service-type.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Service Types')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all active service types (public)' })
  findAll(@Query('activeOnly') activeOnly: string, @CurrentUser() user?: any) {
    const onlyActive = activeOnly !== 'false';
    return this.serviceTypesService.findAll(user?.outletId, onlyActive);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a service type by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceTypesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new service type' })
  create(@Body() dto: CreateServiceTypeDto, @CurrentUser() user: any) {
    return this.serviceTypesService.create(dto, user?.outletId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update a service type' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceTypeDto) {
    return this.serviceTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Soft-delete (deactivate) a service type' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceTypesService.remove(id);
  }
}
