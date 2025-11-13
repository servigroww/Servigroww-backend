import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

// ============================================
// FILE: src/modules/services/dto/create-service.dto.ts
// ============================================

import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateServiceDto {
  @IsUUID()
  category_id: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  base_price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  estimated_duration_minutes?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}