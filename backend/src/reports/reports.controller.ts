import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService, ReportQuery } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles('OWNER', 'ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPI dashboard data' })
  dashboard(@CurrentUser() user: any, @Query('outletId') outletId?: string) {
    const id = outletId ? parseInt(outletId) : (user.role !== 'OWNER' ? user.outletId : undefined);
    return this.reportsService.getDashboard(id);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue chart data' })
  revenue(@Query() query: ReportQuery, @CurrentUser() user: any) {
    if (user.role !== 'OWNER') query.outletId = user.outletId;
    return this.reportsService.getRevenueReport(query);
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Order status statistics' })
  orderStats(@Query() query: ReportQuery, @CurrentUser() user: any) {
    if (user.role !== 'OWNER') query.outletId = user.outletId;
    return this.reportsService.getOrderStats(query);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Top customers by revenue' })
  topCustomers(@CurrentUser() user: any) {
    return this.reportsService.getTopCustomers(user.role !== 'OWNER' ? user.outletId : undefined);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export orders to Excel' })
  exportExcel(@Query() query: ReportQuery, @Res() res: Response, @CurrentUser() user: any) {
    if (user.role !== 'OWNER') query.outletId = user.outletId;
    return this.reportsService.exportExcel(query, res);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export summary report to PDF' })
  exportPdf(@Query() query: ReportQuery, @Res() res: Response, @CurrentUser() user: any) {
    if (user.role !== 'OWNER') query.outletId = user.outletId;
    return this.reportsService.exportPdf(query, res);
  }
}
