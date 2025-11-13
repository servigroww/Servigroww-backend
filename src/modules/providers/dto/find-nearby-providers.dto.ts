import { IsUUID, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class FindNearbyProvidersDto {
  @IsUUID()
  service_id: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  radius_meters?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}