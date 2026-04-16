import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateShiftDto {
  @ApiProperty({ example: 'Pagi' }) @IsString() name: string;
  @ApiProperty({ example: '07:00' }) @IsString() startTime: string;
  @ApiProperty({ example: '15:00' }) @IsString() endTime: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {}

export class AssignShiftDto {
  @ApiProperty() @IsInt() @Type(() => Number) employeeId: number;
  @ApiProperty() @IsInt() @Type(() => Number) shiftId: number;
  @ApiProperty({ example: '2024-01-15' }) @IsString() workDate: string;
}

export class ShiftQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Type(() => Number) outletId?: number;
}
