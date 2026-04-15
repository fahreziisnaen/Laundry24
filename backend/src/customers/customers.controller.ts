import {
  Controller, Get, Post, Patch, Delete, Body,
  Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, TopUpWalletDto, CustomerQueryDto } from './dto/customer.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Register new customer' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: any) {
    return this.customersService.create(dto, user.outletId);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List customers' })
  findAll(@Query() query: CustomerQueryDto, @CurrentUser() user: any) {
    return this.customersService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer profile with history' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Update customer' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/wallet/topup')
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Top-up customer wallet' })
  topUp(@Param('id', ParseIntPipe) id: number, @Body() dto: TopUpWalletDto) {
    return this.customersService.topUpWallet(id, dto);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Customer transaction history' })
  history(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.getTransactionHistory(id);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Soft-delete customer' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
