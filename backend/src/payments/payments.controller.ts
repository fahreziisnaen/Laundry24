import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService, CreatePaymentDto } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Process payment for an order' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.paymentsService.createPayment(dto, user.id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get all payments for an order' })
  getOrderPayments(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentsService.getOrderPayments(orderId);
  }
}
