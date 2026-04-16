import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateServiceTypeDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() @Min(0) @Type(() => Number) basePrice: number;
  @ApiPropertyOptional({ default: 'kg' }) @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional({ default: 24 }) @IsOptional() @IsInt() @Min(1) @Type(() => Number) slaHours?: number;
}

export class UpdateServiceTypeDto extends PartialType(CreateServiceTypeDto) {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ServiceTypeQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean) activeOnly?: boolean;
}
