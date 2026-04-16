import { IsInt, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class CheckInDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) shiftId?: number;
  @ApiPropertyOptional() @IsOptional() checkInLat?: number;
  @ApiPropertyOptional() @IsOptional() checkInLng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class AttendanceQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) employeeId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) limit?: number;
}
