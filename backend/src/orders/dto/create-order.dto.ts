import {
  IsInt, IsOptional, IsString, IsNumber, IsArray,
  ValidateNested, IsEnum, IsPositive, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ example: 'Kemeja' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ example: 'Pakai starch' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  customerId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  serviceTypeId: number;

  @ApiPropertyOptional({ example: 3.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiPropertyOptional({ example: 'PROMO10' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No 1' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['RECEIVED', 'WASHING', 'IRONING', 'DONE', 'DELIVERED', 'CANCELLED'] })
  @IsEnum(['RECEIVED', 'WASHING', 'IRONING', 'DONE', 'DELIVERED', 'CANCELLED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) limit?: number = 20;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) outletId?: number;
}
