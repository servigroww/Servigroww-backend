import { IsString, IsPhoneNumber, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../../types/database.types';

export class RegisterDto {
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString()
  email?: string;
}
