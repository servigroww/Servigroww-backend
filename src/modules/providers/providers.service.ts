import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AddServiceDto } from './dto/add-service.dto';
import { FindNearbyProvidersDto } from './dto/find-nearby-providers.dto';

export interface Provider {
  id: string;
  user_id: string;
  bio?: string;
  experience_years: number;
  hourly_rate?: number;
  is_online: boolean;
  is_verified: boolean;
  work_radius_meters: number;
  total_jobs: number;
  completed_jobs: number;
  average_rating: number;
  total_earnings: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProviderWithUser extends Provider {
  name: string;
  phone: string;
  email?: string;
  profile_photo_url?: string;
}

export interface ProviderService {
  id: string;
  provider_id: string;
  service_id: string;
  custom_price?: number;
  is_active: boolean;
  service_name: string;
  service_slug: string;
  category_name: string;
}

export interface NearbyProvider {
  provider_id: string;
  provider_name: string;
  distance_meters: number;
  average_rating: number;
  hourly_rate?: number;
  completed_jobs: number;
  profile_photo_url?: string;
  bio?: string;
}

@Injectable()
export class ProvidersService {
  constructor(private db: DatabaseService) {}

  /**
   * Get provider by user ID
   */
  async getProviderByUserId(userId: string): Promise<ProviderWithUser> {
    const provider = await this.db.queryOne(
      `SELECT 
        p.*,
        u.name,
        u.phone,
        u.email,
        u.profile_photo_url
       FROM providers p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return provider;
  }

  /**
   * Get provider by provider ID
   */
  async getProviderById(providerId: string): Promise<ProviderWithUser> {
    const provider = await this.db.queryOne(
      `SELECT 
        p.*,
        u.name,
        u.phone,
        u.email,
        u.profile_photo_url
       FROM providers p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [providerId]
    );

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  /**
   * Update provider profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProviderProfileDto
  ): Promise<Provider> {
    const provider = await this.getProviderByUserId(userId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateDto).forEach((key) => {
      if (updateDto[key] !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(updateDto[key]);
      }
    });

    if (updates.length === 0) {
      return provider;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(provider.id);

    const result = await this.db.queryOne(
      `UPDATE providers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result;
  }

  /**
   * Go online/offline
   */
  async setOnlineStatus(userId: string, isOnline: boolean): Promise<Provider> {
    const provider = await this.getProviderByUserId(userId);

    if (!provider.is_verified) {
      throw new ForbiddenException('Provider must be verified before going online');
    }

    const result = await this.db.queryOne(
      `UPDATE providers 
       SET is_online = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [isOnline, provider.id]
    );

    return result;
  }

  /**
   * Update current location
   */
  async updateLocation(
    userId: string,
    updateLocationDto: UpdateLocationDto
  ): Promise<void> {
    const provider = await this.getProviderByUserId(userId);
    const { latitude, longitude } = updateLocationDto;

    await this.db.query(
      `UPDATE providers 
       SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [longitude, latitude, provider.id]
    );

    // Also log location history
    await this.db.query(
      `INSERT INTO provider_locations (provider_id, location, timestamp)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), CURRENT_TIMESTAMP)`,
      [provider.id, longitude, latitude]
    );
  }

  /**
   * Get provider's services/skills
   */
  async getProviderServices(providerId: string): Promise<ProviderService[]> {
    return await this.db.queryMany(
      `SELECT 
        ps.*,
        s.name as service_name,
        s.slug as service_slug,
        sc.name as category_name
       FROM provider_services ps
       JOIN services s ON ps.service_id = s.id
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE ps.provider_id = $1 AND ps.is_active = true
       ORDER BY sc.display_order, s.name`,
      [providerId]
    );
  }

  /**
   * Add service/skill to provider
   */
  async addService(
    userId: string,
    addServiceDto: AddServiceDto
  ): Promise<ProviderService> {
    const provider = await this.getProviderByUserId(userId);
    const { service_id, custom_price } = addServiceDto;

    // Check if service exists
    const service = await this.db.queryOne(
      `SELECT id FROM services WHERE id = $1 AND is_active = true`,
      [service_id]
    );

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if already added
    const existing = await this.db.queryOne(
      `SELECT id FROM provider_services 
       WHERE provider_id = $1 AND service_id = $2`,
      [provider.id, service_id]
    );

    if (existing) {
      throw new BadRequestException('Service already added');
    }

    const result = await this.db.queryOne(
      `INSERT INTO provider_services (provider_id, service_id, custom_price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [provider.id, service_id, custom_price]
    );

    // Get full details
    const fullService = await this.db.queryOne(
      `SELECT 
        ps.*,
        s.name as service_name,
        s.slug as service_slug,
        sc.name as category_name
       FROM provider_services ps
       JOIN services s ON ps.service_id = s.id
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE ps.id = $1`,
      [result.id]
    );

    return fullService;
  }

  /**
   * Remove service from provider
   */
  async removeService(userId: string, serviceId: string): Promise<void> {
    const provider = await this.getProviderByUserId(userId);

    await this.db.query(
      `DELETE FROM provider_services 
       WHERE provider_id = $1 AND service_id = $2`,
      [provider.id, serviceId]
    );
  }

  /**
   * Find nearby providers for a service
   * This is the CORE matching algorithm!
   */
  async findNearbyProviders(
    findDto: FindNearbyProvidersDto
  ): Promise<NearbyProvider[]> {
    const {
      service_id,
      latitude,
      longitude,
      radius_meters = 5000,
      limit = 10
    } = findDto;

    const providers = await this.db.queryMany(
      `SELECT 
        p.id as provider_id,
        u.name as provider_name,
        ST_Distance(
          p.current_location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) as distance_meters,
        p.average_rating,
        p.hourly_rate,
        p.completed_jobs,
        u.profile_photo_url,
        p.bio
       FROM providers p
       JOIN users u ON p.user_id = u.id
       JOIN provider_services ps ON p.id = ps.provider_id
       WHERE 
        ps.service_id = $3
        AND ps.is_active = true
        AND p.is_online = true
        AND p.is_verified = true
        AND u.status = 'active'
        AND p.current_location IS NOT NULL
        AND ST_DWithin(
          p.current_location::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $4
        )
       ORDER BY 
        distance_meters ASC,
        p.average_rating DESC,
        p.completed_jobs DESC
       LIMIT $5`,
      [latitude, longitude, service_id, radius_meters, limit]
    );

    return providers;
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(userId: string): Promise<any> {
    const provider = await this.getProviderByUserId(userId);

    const stats = await this.db.queryOne(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'ongoing')) as active_bookings,
        COALESCE(AVG(customer_rating), 0) as average_rating,
        COALESCE(SUM(provider_earnings), 0) as total_earnings
       FROM bookings
       WHERE provider_id = $1`,
      [provider.id]
    );

    // Get wallet balance
    const wallet = await this.db.queryOne(
      `SELECT balance, pending_amount FROM provider_wallets WHERE provider_id = $1`,
      [provider.id]
    );

    return {
      ...stats,
      wallet_balance: wallet?.balance || 0,
      pending_amount: wallet?.pending_amount || 0,
    };
  }

  /**
   * Get all providers (Admin only)
   */
  async getAllProviders(
    page = 1,
    limit = 20,
    isVerified?: boolean,
    isOnline?: boolean
  ): Promise<{
    providers: ProviderWithUser[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (isVerified !== undefined) {
      whereConditions.push(`p.is_verified = $${paramIndex++}`);
      values.push(isVerified);
    }

    if (isOnline !== undefined) {
      whereConditions.push(`p.is_online = $${paramIndex++}`);
      values.push(isOnline);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM providers p ${whereClause}`,
      values
    );
    const total = parseInt(countResult.count);

    // Get providers
    const providers = await this.db.queryMany(
      `SELECT 
        p.*,
        u.name,
        u.phone,
        u.email,
        u.profile_photo_url
       FROM providers p
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, limit, offset]
    );

    return {
      providers,
      total,
      page,
      limit,
    };
  }

  /**
   * Verify provider (Admin only)
   */
  async verifyProvider(
    providerId: string,
    isVerified: boolean
  ): Promise<Provider> {
    const result = await this.db.queryOne(
      `UPDATE providers 
       SET is_verified = $1, 
           verification_status = $2,
           verification_date = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [isVerified, isVerified ? 'verified' : 'rejected', providerId]
    );

    if (!result) {
      throw new NotFoundException('Provider not found');
    }

    return result;
  }
}