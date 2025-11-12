import { IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @IsPhoneNumber('IN')
  phone: string;
}
