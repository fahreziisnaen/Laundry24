import { Module } from '@nestjs/common';
import { IotService } from './iot.service';
import { IotController } from './iot.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [IotController],
  providers: [IotService],
})
export class IotModule {}
