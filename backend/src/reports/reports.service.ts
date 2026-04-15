import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

export interface ReportQuery {
  outletId?: number;
  dateFrom?: string;
  dateTo?: string;
  period?: 'day' | 'week' | 'month';
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ── Dashboard KPI summary ────────────────────────────────────
  async getDashboard(outletId?: number) {
    const today = dayjs().startOf('day').toDate();
    const thisMonthStart = dayjs().startOf('month').toDate();
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
    const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

    const whereBase = { ...(outletId && { outletId }), deletedAt: null };

    const [
      todayOrders,
      monthOrders,
      lastMonthOrders,
      pendingOrders,
      revenueThisMonth,
      revenueLastMonth,
      totalCustomers,
      lowStockItems,
    ] = await this.prisma.$transaction([
      this.prisma.order.count({ where: { ...whereBase, createdAt: { gte: today } } }),
      this.prisma.order.count({ where: { ...whereBase, createdAt: { gte: thisMonthStart } } }),
      this.prisma.order.count({ where: { ...whereBase, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      this.prisma.order.count({ where: { ...whereBase, status: { in: ['RECEIVED', 'WASHING', 'IRONING'] } } }),
      this.prisma.payment.aggregate({
        where: { order: whereBase, status: 'SUCCESS', createdAt: { gte: thisMonthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { order: whereBase, status: 'SUCCESS', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.customer.count({ where: { ...(outletId && { outletId }) } }),
      this.prisma.inventoryItem.count({
        where: { ...(outletId && { outletId }), isActive: true },
      }),
    ]);

    const revenue = Number(revenueThisMonth._sum.amount ?? 0);
    const revenueLastM = Number(revenueLastMonth._sum.amount ?? 0);
    const revenueGrowth = revenueLastM > 0 ? ((revenue - revenueLastM) / revenueLastM) * 100 : 0;

    return {
      today: { orders: todayOrders },
      month: {
        orders: monthOrders,
        lastMonthOrders,
        revenue,
        revenueLastMonth: revenueLastM,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      },
      active: { pendingOrders },
      customers: { total: totalCustomers },
    };
  }

  // ── Revenue report (chart data) ──────────────────────────────
  async getRevenueReport(query: ReportQuery) {
    const { outletId, dateFrom, dateTo, period = 'day' } = query;
    const from = dateFrom ? new Date(dateFrom) : dayjs().subtract(30, 'day').toDate();
    const to = dateTo ? new Date(dateTo) : new Date();

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        paidAt: { gte: from, lte: to },
        ...(outletId && { order: { outletId } }),
      },
      select: { amount: true, paidAt: true, method: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by day
    const grouped = new Map<string, number>();
    for (const p of payments) {
      const key = dayjs(p.paidAt).format('YYYY-MM-DD');
      grouped.set(key, (grouped.get(key) ?? 0) + Number(p.amount));
    }

    return Array.from(grouped.entries()).map(([date, total]) => ({ date, total }));
  }

  // ── Order status breakdown ───────────────────────────────────
  async getOrderStats(query: ReportQuery) {
    const { outletId, dateFrom, dateTo } = query;
    const from = dateFrom ? new Date(dateFrom) : dayjs().subtract(30, 'day').toDate();
    const to = dateTo ? new Date(dateTo) : new Date();

    return this.prisma.order.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        createdAt: { gte: from, lte: to },
        ...(outletId && { outletId }),
      },
      _count: { id: true },
    });
  }

  // ── Top customers ────────────────────────────────────────────
  async getTopCustomers(outletId?: number, limit = 10) {
    return this.prisma.order.groupBy({
      by: ['customerId'],
      where: { deletedAt: null, ...(outletId && { outletId }) },
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: limit,
    });
  }

  // ── Export to Excel ──────────────────────────────────────────
  async exportExcel(query: ReportQuery, res: Response) {
    const from = query.dateFrom ? new Date(query.dateFrom) : dayjs().subtract(30, 'day').toDate();
    const to = query.dateTo ? new Date(query.dateTo) : new Date();

    const orders = await this.prisma.order.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: from, lte: to },
        ...(query.outletId && { outletId: query.outletId }),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        serviceType: { select: { name: true } },
        outlet: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orders');

    ws.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Order Number', key: 'orderNumber', width: 20 },
      { header: 'Outlet', key: 'outlet', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Service', key: 'service', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Payment', key: 'payment', width: 12 },
      { header: 'Created', key: 'created', width: 18 },
    ];

    // Header styling
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    orders.forEach((order, i) => {
      ws.addRow({
        no: i + 1,
        orderNumber: order.orderNumber,
        outlet: order.outlet.name,
        customer: order.customer.name,
        phone: order.customer.phone,
        service: order.serviceType.name,
        status: order.status,
        total: Number(order.totalAmount),
        payment: order.paymentStatus,
        created: dayjs(order.createdAt).format('YYYY-MM-DD HH:mm'),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laundry24-report-${dayjs().format('YYYYMMDD')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  }

  // ── Export to PDF ─────────────────────────────────────────────
  async exportPdf(query: ReportQuery, res: Response) {
    const dashboard = await this.getDashboard(query.outletId);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="laundry24-report-${dayjs().format('YYYYMMDD')}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).fillColor('#1E3A5F').text('Laundry24 — Revenue Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(`Generated: ${dayjs().format('DD MMMM YYYY HH:mm')}`, { align: 'center' });
    doc.moveDown(2);

    // KPIs
    doc.fontSize(14).fillColor('#333').text('Monthly Summary');
    doc.moveDown(0.5);
    const kpis = [
      ['Orders This Month', dashboard.month.orders],
      ['Revenue This Month', `Rp ${Number(dashboard.month.revenue).toLocaleString('id-ID')}`],
      ['Revenue Growth', `${dashboard.month.revenueGrowth}%`],
      ['Total Customers', dashboard.customers.total],
      ['Pending Orders', dashboard.active.pendingOrders],
    ];
    for (const [label, value] of kpis) {
      doc.fontSize(11).fillColor('#000')
        .text(`${label}: `, { continued: true })
        .fillColor('#1E3A5F').text(String(value));
    }

    doc.end();
  }
}
