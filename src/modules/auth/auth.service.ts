import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { User, UserRole, UserStatus } from '../../types/database.types';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

interface JwtPayload {
  sub: string; // User ID
  phone: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  // In-memory OTP storage (for development)
  // In production, use Redis with expiry
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Send OTP to phone number
   * Works for both registration and login
   */
  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ 
    success: boolean; 
    message: string;
    isRegistered: boolean; // Tell frontend if user exists
  }> {
    const { phone } = sendOtpDto;

    // Check if user exists
    const existingUser = await this.db.queryOne(
      `SELECT id, name, role FROM users WHERE phone = $1 AND status = $2`,
      [phone, UserStatus.ACTIVE]
    );

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.otpStore.set(phone, { otp, expiresAt });

    // TODO: In production, send SMS via Fast2SMS/Twilio
    console.log(`📱 OTP for ${phone}: ${otp}`);
    console.log(`User ${existingUser ? 'EXISTS' : 'NOT FOUND'} - ${existingUser ? 'Login' : 'Registration required'}`);

    // Determine purpose
    const purpose = existingUser ? 'login' : 'registration';

    // Log to SMS table with purpose
    await this.db.query(
      `INSERT INTO sms_logs (phone, message, purpose, status) 
       VALUES ($1, $2, $3, $4)`,
      [phone, `Your ServiGroww OTP is: ${otp}`, purpose, 'sent']
    );

    return {
      success: true,
      message: existingUser 
        ? 'OTP sent successfully. Please verify to login.' 
        : 'Phone number not registered. Please complete registration first.',
      isRegistered: !!existingUser,
    };
  }

  /**
   * Verify OTP and login (for existing users)
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: User;
  }> {
    const { phone, otp } = verifyOtpDto;

    // Check OTP exists
    const storedOtp = this.otpStore.get(phone);
    if (!storedOtp) {
      throw new BadRequestException('OTP not found. Please request a new OTP.');
    }

    // Check OTP expiry
    if (storedOtp.expiresAt < new Date()) {
      this.otpStore.delete(phone);
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }

    // Verify OTP matches
    if (storedOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP verified successfully, delete it
    this.otpStore.delete(phone);

    // Find user - FIXED: Remove type parameter from query
    const user = await this.db.queryOne(
      `SELECT * FROM users WHERE phone = $1 AND status = $2`,
      [phone, UserStatus.ACTIVE]
    );

    if (!user) {
      throw new UnauthorizedException('User not registered. Please sign up first.');
    }

    // Update last login
    await this.db.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Register new user
   * Call this AFTER sending OTP
   */
  async register(registerDto: RegisterDto): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    const { phone, name, role, email } = registerDto;

    // Check if user already exists
    const existingUser = await this.db.queryOne(
      `SELECT id FROM users WHERE phone = $1`,
      [phone]
    );

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Start transaction - FIXED: Remove type parameter
    const result = await this.db.transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (phone, name, role, email, status) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [phone, name, role, email, UserStatus.ACTIVE]
      );
      const user = userResult.rows[0];

      // Create role-specific profile
      if (role === UserRole.CUSTOMER) {
        await client.query(
          `INSERT INTO customers (user_id) VALUES ($1)`,
          [user.id]
        );
      } else if (role === UserRole.PROVIDER) {
        // Create provider profile
        await client.query(
          `INSERT INTO providers (user_id, is_online, is_verified) 
           VALUES ($1, false, false)`,
          [user.id]
        );
        
        // Create wallet
        await client.query(
          `INSERT INTO provider_wallets (provider_id) 
           VALUES ((SELECT id FROM providers WHERE user_id = $1))`,
          [user.id]
        );
      }

      return user;
    });

    return {
      success: true,
      message: 'Registration successful. OTP has been sent to your phone.',
      user: result,
    };
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string): Promise<User> {
    // FIXED: Remove type parameter
    const user = await this.db.queryOne(
      `SELECT * FROM users WHERE id = $1 AND status = $2`,
      [userId, UserStatus.ACTIVE]
    );

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.validateUser(payload.sub);
      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}