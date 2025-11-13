import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  experience_years?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  work_radius_meters?: number;
}
