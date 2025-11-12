import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as databaseTypes from '../../types/database.types';
import { ResponseUtil } from '../../common/interfaces/response.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Register new user
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return ResponseUtil.success(result, 'Registration successful');
  }

  /**
   * POST /api/v1/auth/send-otp
   * Send OTP to phone number
   */
  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    const result = await this.authService.sendOtp(sendOtpDto);
    return ResponseUtil.success(result, 'OTP sent successfully');
  }

  /**
   * POST /api/v1/auth/verify-otp
   * Verify OTP and login
   */
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(verifyOtpDto);
    return ResponseUtil.success(result, 'Login successful');
  }

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  @Post('refresh')
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return ResponseUtil.success(result, 'Token refreshed');
  }

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: databaseTypes.User) {
    return ResponseUtil.success(user, 'Profile retrieved');
  }
}
