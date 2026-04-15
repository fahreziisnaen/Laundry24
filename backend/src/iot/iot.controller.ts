import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IotService, CreateMachineDto, MachinePingDto } from './iot.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('IoT / Machines')
@ApiBearerAuth()
@Controller('iot')
export class IotController {
  constructor(private readonly iotService: IotService) {}

  @Post('machines')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Register new machine' })
  create(@Body() dto: CreateMachineDto) {
    return this.iotService.createMachine(dto);
  }

  @Get('machines')
  @ApiOperation({ summary: 'Get machines for outlet' })
  getMachines(@CurrentUser() user: any, @Query('outletId') outletId?: string) {
    const id = outletId ? parseInt(outletId) : user.outletId;
    return this.iotService.getMachines(id);
  }

  @Post('machines/:id/ping')
  @ApiOperation({ summary: 'Machine IoT ping (status update)' })
  ping(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MachinePingDto,
    @CurrentUser() user: any,
  ) {
    return this.iotService.ping(id, dto, user?.id);
  }

  @Post('nfc/scan')
  @ApiOperation({ summary: 'Simulate NFC card scan → assign machine to order' })
  nfcScan(@Body() body: { nfcUid: string; orderId: number }) {
    return this.iotService.nfcScan(body.nfcUid, body.orderId);
  }

  @Get('machines/:id/logs')
  @ApiOperation({ summary: 'Get machine usage logs' })
  logs(@Param('id', ParseIntPipe) id: number) {
    return this.iotService.getMachineLogs(id);
  }
}
