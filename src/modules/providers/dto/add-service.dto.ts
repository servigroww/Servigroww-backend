import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';

export class AddServiceDto {
  @IsUUID()
  service_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  custom_price?: number;
}