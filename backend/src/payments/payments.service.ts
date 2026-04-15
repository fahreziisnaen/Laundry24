import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  orderId: number;

  @ApiProperty({ enum: ['CASH', 'TRANSFER', 'QRIS', 'WALLET', 'LOYALTY'] })
  @IsEnum(['CASH', 'TRANSFER', 'QRIS', 'WALLET', 'LOYALTY'])
  method: PaymentMethod;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNo?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: CreatePaymentDto, cashierId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId }, include: { customer: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === 'PAID') throw new BadRequestException('Order already fully paid');

    // Wallet payment: deduct balance
    if (dto.method === 'WALLET') {
      const balance = Number(order.customer.walletBalance);
      if (balance < dto.amount) throw new BadRequestException('Insufficient wallet balance');

      const newBalance = balance - dto.amount;
      await this.prisma.customer.update({
        where: { id: order.customerId },
        data: { walletBalance: newBalance },
      });
      await this.prisma.walletTransaction.create({
        data: {
          customerId: order.customerId,
          orderId: order.id,
          type: 'DEDUCT',
          amount: dto.amount,
          balanceAfter: newBalance,
        },
      });
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        cashierId,
        method: dto.method,
        amount: dto.amount,
        referenceNo: dto.referenceNo,
        status: 'SUCCESS',
        paidAt: new Date(),
      },
    });

    // Recompute paid amount & status
    const allPayments = await this.prisma.payment.findMany({
      where: { orderId: dto.orderId, status: 'SUCCESS' },
    });
    const paidAmount = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paymentStatus = paidAmount >= Number(order.totalAmount) ? 'PAID'
      : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: { paidAmount, paymentStatus },
    });

    return { payment, paidAmount, paymentStatus };
  }

  async getOrderPayments(orderId: number) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: { cashier: { select: { name: true } } },
    });
  }
}
