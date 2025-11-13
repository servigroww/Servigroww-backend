import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  base_price: number;
  estimated_duration_minutes?: number;
  is_active: boolean;
  created_at: Date;
}

export interface ServiceWithCategory extends Service {
  category_name: string;
  category_slug: string;
}

@Injectable()
export class ServicesService {
  constructor(private db: DatabaseService) {}

  // ==================== CATEGORIES ====================

  /**
   * Get all service categories
   */
  async getAllCategories(includeInactive = false): Promise<ServiceCategory[]> {
    const query = includeInactive
      ? `SELECT * FROM service_categories ORDER BY display_order, name`
      : `SELECT * FROM service_categories WHERE is_active = true ORDER BY display_order, name`;

    return await this.db.queryMany(query);
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<ServiceCategory> {
    const category = await this.db.queryOne(
      `SELECT * FROM service_categories WHERE id = $1`,
      [id]
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ServiceCategory> {
    const category = await this.db.queryOne(
      `SELECT * FROM service_categories WHERE slug = $1`,
      [slug]
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create new category (Admin only)
   */
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<ServiceCategory> {
    const { name, slug, description, icon_url, is_active, display_order } = createCategoryDto;

    // Check if slug already exists
    const existing = await this.db.queryOne(
      `SELECT id FROM service_categories WHERE slug = $1`,
      [slug]
    );

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const result = await this.db.queryOne(
      `INSERT INTO service_categories (name, slug, description, icon_url, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, description, icon_url, is_active ?? true, display_order ?? 0]
    );

    return result;
  }

  /**
   * Update category (Admin only)
   */
  async updateCategory(id: string, updateData: Partial<CreateCategoryDto>): Promise<ServiceCategory> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return await this.getCategoryById(id);
    }

    values.push(id);

    const result = await this.db.queryOne(
      `UPDATE service_categories SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new NotFoundException('Category not found');
    }

    return result;
  }

  /**
   * Delete category (Admin only)
   */
  async deleteCategory(id: string): Promise<void> {
    // Check if category has services
    const serviceCount = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM services WHERE category_id = $1`,
      [id]
    );

    if (parseInt(serviceCount.count) > 0) {
      throw new ConflictException('Cannot delete category with existing services');
    }

    await this.db.query(
      `DELETE FROM service_categories WHERE id = $1`,
      [id]
    );
  }

  // ==================== SERVICES ====================

  /**
   * Get all services
   */
  async getAllServices(
    categoryId?: string,
    includeInactive = false
  ): Promise<ServiceWithCategory[]> {
    let query = `
      SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug
      FROM services s
      JOIN service_categories sc ON s.category_id = sc.id
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (!includeInactive) {
      conditions.push(`s.is_active = true AND sc.is_active = true`);
    }

    if (categoryId) {
      conditions.push(`s.category_id = $${paramIndex++}`);
      values.push(categoryId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sc.display_order, s.name`;

    return await this.db.queryMany(query, values);
  }

  /**
   * Get services by category slug
   */
  async getServicesByCategorySlug(categorySlug: string): Promise<ServiceWithCategory[]> {
    const services = await this.db.queryMany(
      `SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE sc.slug = $1 AND s.is_active = true AND sc.is_active = true
       ORDER BY s.name`,
      [categorySlug]
    );

    if (services.length === 0) {
      throw new NotFoundException('No services found for this category');
    }

    return services;
  }

  /**
   * Get service by ID
   */
  async getServiceById(id: string): Promise<ServiceWithCategory> {
    const service = await this.db.queryOne(
      `SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE s.id = $1`,
      [id]
    );

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Search services by name
   */
  async searchServices(query: string): Promise<ServiceWithCategory[]> {
    return await this.db.queryMany(
      `SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug,
        similarity(s.name, $1) as relevance
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       WHERE s.is_active = true 
         AND sc.is_active = true
         AND s.name % $1
       ORDER BY relevance DESC, s.name
       LIMIT 20`,
      [query]
    );
  }

  /**
   * Create new service (Admin only)
   */
  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    const {
      category_id,
      name,
      slug,
      description,
      base_price,
      estimated_duration_minutes,
      is_active
    } = createServiceDto;

    // Verify category exists
    await this.getCategoryById(category_id);

    // Check if slug already exists in this category
    const existing = await this.db.queryOne(
      `SELECT id FROM services WHERE slug = $1 AND category_id = $2`,
      [slug, category_id]
    );

    if (existing) {
      throw new ConflictException('Service with this slug already exists in this category');
    }

    const result = await this.db.queryOne(
      `INSERT INTO services (
        category_id, name, slug, description, base_price, 
        estimated_duration_minutes, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        category_id,
        name,
        slug,
        description,
        base_price,
        estimated_duration_minutes,
        is_active ?? true
      ]
    );

    return result;
  }

  /**
   * Update service (Admin only)
   */
  async updateService(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateServiceDto).forEach((key) => {
      if (updateServiceDto[key] !== undefined) {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(updateServiceDto[key]);
      }
    });

    if (updates.length === 0) {
      return await this.getServiceById(id);
    }

    values.push(id);

    const result = await this.db.queryOne(
      `UPDATE services SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!result) {
      throw new NotFoundException('Service not found');
    }

    return result;
  }

  /**
   * Delete service (Admin only)
   */
  async deleteService(id: string): Promise<void> {
    // Check if service is being used in any bookings
    const bookingCount = await this.db.queryOne(
      `SELECT COUNT(*) as count FROM bookings WHERE service_id = $1`,
      [id]
    );

    if (parseInt(bookingCount.count) > 0) {
      throw new ConflictException('Cannot delete service with existing bookings');
    }

    await this.db.query(
      `DELETE FROM services WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get popular services (most booked)
   */
  async getPopularServices(limit = 10): Promise<ServiceWithCategory[]> {
    return await this.db.queryMany(
      `SELECT 
        s.*,
        sc.name as category_name,
        sc.slug as category_slug,
        COUNT(b.id) as booking_count
       FROM services s
       JOIN service_categories sc ON s.category_id = sc.id
       LEFT JOIN bookings b ON s.id = b.service_id
       WHERE s.is_active = true AND sc.is_active = true
       GROUP BY s.id, sc.name, sc.slug
       ORDER BY booking_count DESC
       LIMIT $1`,
      [limit]
    );
  }
}