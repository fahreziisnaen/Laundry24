import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderQueryDto } from './dto/create-order.dto';
import dayjs from 'dayjs';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── Create order ─────────────────────────────────────────────
  async create(dto: CreateOrderDto, staffId: number, outletId: number) {
    // Validate customer
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    // Validate service type
    const service = await this.prisma.serviceType.findUnique({ where: { id: dto.serviceTypeId } });
    if (!service || !service.isActive) throw new NotFoundException('Service type not found');

    // Calculate pricing
    let subtotal = 0;
    const itemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    if (service.code === 'KILOAN' || service.code === 'EXPRESS') {
      if (!dto.totalWeight) throw new BadRequestException('Weight is required for kiloan service');
      subtotal = Number(service.basePrice) * dto.totalWeight;
    } else {
      // SATUAN
      if (!dto.items?.length) throw new BadRequestException('Items required for satuan service');
      for (const item of dto.items) {
        const total = item.quantity * item.unitPrice;
        subtotal += total;
        itemsData.push({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: total,
          notes: item.notes,
        });
      }
    }

    // Apply promo
    let discountAmount = 0;
    if (dto.promoCode) {
      const promo = await this.prisma.promotion.findUnique({
        where: { code: dto.promoCode },
      });
      if (promo && promo.isActive && dayjs().isBefore(dayjs(promo.validUntil))) {
        if (subtotal >= Number(promo.minOrder)) {
          if (promo.type === 'PERCENT') {
            discountAmount = subtotal * (Number(promo.value) / 100);
            if (promo.maxDiscount) discountAmount = Math.min(discountAmount, Number(promo.maxDiscount));
          } else if (promo.type === 'FIXED') {
            discountAmount = Number(promo.value);
          }
          // Increment usage
          await this.prisma.promotion.update({
            where: { id: promo.id },
            data: { usageCount: { increment: 1 } },
          });
        }
      }
    }

    const taxAmount = 0; // can be configured
    const totalAmount = subtotal - discountAmount + taxAmount;
    const estimatedDoneAt = dayjs().add(service.slaHours, 'hour').toDate();
    const orderNumber = await this.generateOrderNumber(outletId);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        outletId,
        customerId: dto.customerId,
        staffId,
        serviceTypeId: dto.serviceTypeId,
        totalWeight: dto.totalWeight,
        totalItems: itemsData.length || undefined,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        notes: dto.notes,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        estimatedDoneAt,
        items: { create: itemsData },
        statusHistory: {
          create: { status: 'RECEIVED', userId: staffId, notes: 'Order created' },
        },
      },
      include: {
        customer: true,
        serviceType: true,
        items: true,
      },
    });

    // Notify customer
    await this.notifications.send({
      customerId: customer.id,
      type: 'ORDER_STATUS',
      title: 'Order Diterima!',
      body: `Pesanan #${orderNumber} telah diterima. Estimasi selesai: ${dayjs(estimatedDoneAt).format('DD MMM HH:mm')}`,
      data: { orderId: order.id, orderNumber },
    });

    return order;
  }

  // ── List orders ──────────────────────────────────────────────
  async findAll(query: OrderQueryDto, user: any) {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo, outletId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
    };

    // Non-owners can only see their outlet's orders
    if (user.role !== 'OWNER') {
      where.outletId = user.outletId;
    } else if (outletId) {
      where.outletId = outletId;
    }

    if (status) where.status = status as OrderStatus;

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          serviceType: { select: { id: true, name: true, code: true } },
          outlet: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Get single order ─────────────────────────────────────────
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        serviceType: true,
        outlet: true,
        staff: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true } },
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, name: true } } },
        },
        payments: true,
        deliveryTask: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // ── Update status ────────────────────────────────────────────
  async updateStatus(id: number, dto: UpdateOrderStatusDto, userId: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const timestamps: Record<string, Date | undefined> = {
      WASHING: { washedAt: new Date() } as any,
      IRONING: { ironedAt: new Date() } as any,
      DONE:    { readyAt: new Date() } as any,
      DELIVERED: { deliveredAt: new Date() } as any,
    }[dto.status] ?? {};

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status as OrderStatus,
        ...timestamps,
        statusHistory: {
          create: { status: dto.status as OrderStatus, userId, notes: dto.notes },
        },
      },
    });

    // Push real-time notification
    await this.notifications.send({
      customerId: order.customerId,
      type: 'ORDER_STATUS',
      title: `Status Pesanan Diperbarui`,
      body: `Pesanan #${order.orderNumber} sekarang: ${dto.status}`,
      data: { orderId: id, status: dto.status },
    });

    return updated;
  }

  // ── Soft delete ──────────────────────────────────────────────
  async remove(id: number) {
    return this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Generate order number ─────────────────────────────────────
  private async generateOrderNumber(outletId: number): Promise<string> {
    const today = dayjs().format('YYYYMMDD');
    const prefix = `L24-${today}`;
    const count = await this.prisma.order.count({
      where: {
        orderNumber: { startsWith: prefix },
      },
    });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
}
