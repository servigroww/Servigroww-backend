import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AddServiceDto } from './dto/add-service.dto';
import { FindNearbyProvidersDto } from './dto/find-nearby-providers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as databaseTypes from '../../types/database.types';
import { ResponseUtil } from '../../common/interfaces/response.interface';

@Controller('providers')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  // ==================== PROVIDER ENDPOINTS ====================

  /**
   * GET /api/v1/providers/me
   * Get current provider profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Get('me')
  async getMyProfile(@CurrentUser() user: databaseTypes.User) {
    const provider = await this.providersService.getProviderByUserId(user.id);
    return ResponseUtil.success(provider);
  }

  /**
   * PUT /api/v1/providers/me
   * Update provider profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Put('me')
  async updateProfile(
    @CurrentUser() user: databaseTypes.User,
    @Body() updateDto: UpdateProviderProfileDto,
  ) {
    const provider = await this.providersService.updateProfile(user.id, updateDto);
    return ResponseUtil.success(provider, 'Profile updated successfully');
  }

  /**
   * POST /api/v1/providers/go-online
   * Go online
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Post('go-online')
  async goOnline(@CurrentUser() user: databaseTypes.User) {
    const provider = await this.providersService.setOnlineStatus(user.id, true);
    return ResponseUtil.success(provider, 'You are now online');
  }

  /**
   * POST /api/v1/providers/go-offline
   * Go offline
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Post('go-offline')
  async goOffline(@CurrentUser() user: databaseTypes.User) {
    const provider = await this.providersService.setOnlineStatus(user.id, false);
    return ResponseUtil.success(provider, 'You are now offline');
  }

  /**
   * PUT /api/v1/providers/location
   * Update current location
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Put('location')
  async updateLocation(
    @CurrentUser() user: databaseTypes.User,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    await this.providersService.updateLocation(user.id, updateLocationDto);
    return ResponseUtil.success(null, 'Location updated');
  }

  /**
   * GET /api/v1/providers/me/services
   * Get my services/skills
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Get('me/services')
  async getMyServices(@CurrentUser() user: databaseTypes.User) {
    const provider = await this.providersService.getProviderByUserId(user.id);
    const services = await this.providersService.getProviderServices(provider.id);
    return ResponseUtil.success(services);
  }

  /**
   * POST /api/v1/providers/me/services
   * Add service to my profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Post('me/services')
  async addService(
    @CurrentUser() user: databaseTypes.User,
    @Body() addServiceDto: AddServiceDto,
  ) {
    const service = await this.providersService.addService(user.id, addServiceDto);
    return ResponseUtil.success(service, 'Service added successfully');
  }

  /**
   * DELETE /api/v1/providers/me/services/:serviceId
   * Remove service from my profile
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Delete('me/services/:serviceId')
  async removeService(
    @CurrentUser() user: databaseTypes.User,
    @Param('serviceId') serviceId: string,
  ) {
    await this.providersService.removeService(user.id, serviceId);
    return ResponseUtil.success(null, 'Service removed');
  }

  /**
   * GET /api/v1/providers/me/stats
   * Get my statistics
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.PROVIDER)
  @Get('me/stats')
  async getMyStats(@CurrentUser() user: databaseTypes.User) {
    const stats = await this.providersService.getProviderStats(user.id);
    return ResponseUtil.success(stats);
  }

  // ==================== PUBLIC/CUSTOMER ENDPOINTS ====================

  /**
   * POST /api/v1/providers/find-nearby
   * Find nearby providers for a service
   */
  @Post('find-nearby')
  async findNearbyProviders(@Body() findDto: FindNearbyProvidersDto) {
    const providers = await this.providersService.findNearbyProviders(findDto);
    return ResponseUtil.success(providers);
  }

  /**
   * GET /api/v1/providers/:id
   * Get provider profile by ID (public)
   */
  @Get(':id')
  async getProviderById(@Param('id') id: string) {
    const provider = await this.providersService.getProviderById(id);
    const services = await this.providersService.getProviderServices(id);
    return ResponseUtil.success({ ...provider, services });
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * GET /api/v1/providers
   * Get all providers (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.ADMIN)
  @Get()
  async getAllProviders(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
    @Query('is_verified') isVerified?: boolean,
    @Query('is_online') isOnline?: boolean,
  ) {
    const result = await this.providersService.getAllProviders(
      page,
      limit,
      isVerified,
      isOnline,
    );
    return ResponseUtil.success(result);
  }

  /**
   * PUT /api/v1/providers/:id/verify
   * Verify/reject provider (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(databaseTypes.UserRole.ADMIN)
  @Put(':id/verify')
  async verifyProvider(
    @Param('id') id: string,
    @Body('is_verified', ParseBoolPipe) isVerified: boolean,
  ) {
    const provider = await this.providersService.verifyProvider(id, isVerified);
    return ResponseUtil.success(
      provider,
      isVerified ? 'Provider verified' : 'Provider rejected',
    );
  }
}