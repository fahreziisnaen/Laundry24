import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, TopUpWalletDto, CustomerQueryDto } from './dto/customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, outletId?: number) {
    // Check phone uniqueness
    const exists = await this.prisma.customer.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('Phone number already registered');

    const { password, ...customerData } = dto;

    const customer = await this.prisma.customer.create({
      data: {
        ...customerData,
        outletId,
        ...(password && {
          auth: {
            create: { passwordHash: await bcrypt.hash(password, 12) },
          },
        }),
      },
      include: { auth: false },
    });

    return customer;
  }

  async findAll(query: CustomerQueryDto, user: any) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = { deletedAt: null };

    if (user.role !== 'OWNER') where.outletId = user.outletId;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, phone: true, email: true,
          walletBalance: true, loyaltyPoints: true, isActive: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { serviceType: { select: { name: true } } },
        },
        walletTransactions: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async topUpWallet(id: number, dto: TopUpWalletDto) {
    const customer = await this.findOne(id);
    const newBalance = Number(customer.walletBalance) + dto.amount;

    await this.prisma.$transaction([
      this.prisma.customer.update({
        where: { id },
        data: { walletBalance: newBalance },
      }),
      this.prisma.walletTransaction.create({
        data: {
          customerId: id,
          type: 'TOPUP',
          amount: dto.amount,
          balanceAfter: newBalance,
          reference: dto.reference,
        },
      }),
    ]);

    return { walletBalance: newBalance };
  }

  async getTransactionHistory(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        serviceType: { select: { name: true, code: true } },
        payments: { select: { method: true, amount: true, status: true } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
