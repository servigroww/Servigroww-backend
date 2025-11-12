import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as databaseTypes from '../../types/database.types';
import { ResponseUtil } from '../../common/interfaces/response.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  @Get('me')
  async getProfile(@CurrentUser() user: databaseTypes.User) {
    const profile = await this.usersService.findById(user.id);
    return ResponseUtil.success(profile);
  }

  /**
   * PUT /api/v1/users/me
   * Update current user profile
   */
  @Put('me')
  async updateProfile(
    @CurrentUser() user: databaseTypes.User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(user.id, updateUserDto);
    return ResponseUtil.success(updated, 'Profile updated successfully');
  }

  /**
   * DELETE /api/v1/users/me
   * Delete current user account
   */
  @Delete('me')
  async deleteAccount(@CurrentUser() user: databaseTypes.User) {
    await this.usersService.delete(user.id);
    return ResponseUtil.success(null, 'Account deleted successfully');
  }

  /**
   * GET /api/v1/users/:id
   * Get user by ID (Admin only)
   */
  @UseGuards(RolesGuard)
  @Roles(databaseTypes.UserRole.ADMIN)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return ResponseUtil.success(user);
  }

  /**
   * GET /api/v1/users
   * Get all users with pagination (Admin only)
   */
  @UseGuards(RolesGuard)
  @Roles(databaseTypes.UserRole.ADMIN)
  @Get()
  async getAllUsers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('role') role?: string,
  ) {
    const result = await this.usersService.findAll(page, limit, role);
    return ResponseUtil.success(result);
  }
}
