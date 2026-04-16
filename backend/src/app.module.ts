import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OutletsModule } from './outlets/outlets.module';
import { CustomersModule } from './customers/customers.module';
import { OrdersModule } from './orders/orders.module';
import { EmployeesModule } from './employees/employees.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReportsModule } from './reports/reports.module';
import { DeliveryModule } from './delivery/delivery.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IotModule } from './iot/iot.module';
import { PaymentsModule } from './payments/payments.module';
import { ServiceTypesModule } from './service-types/service-types.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    // ── Config ─────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Rate limiting ───────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // ── Cron jobs ───────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Core ────────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ─────────────────────────────────────
    AuthModule,
    UsersModule,
    OutletsModule,
    CustomersModule,
    OrdersModule,
    EmployeesModule,
    InventoryModule,
    ReportsModule,
    DeliveryModule,
    NotificationsModule,
    IotModule,
    PaymentsModule,
    ServiceTypesModule,
    ShiftsModule,
    AttendanceModule,
  ],
})
export class AppModule {}
