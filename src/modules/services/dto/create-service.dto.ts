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
