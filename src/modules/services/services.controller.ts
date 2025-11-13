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
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../types/database.types';
import { ResponseUtil } from '../../common/interfaces/response.interface';

@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * GET /api/v1/services/categories
   * Get all service categories
   */
  @Get('categories')
  async getAllCategories() {
    const categories = await this.servicesService.getAllCategories();
    return ResponseUtil.success(categories);
  }

  /**
   * GET /api/v1/services/categories/:slug
   * Get category by slug
   */
  @Get('categories/:slug')
  async getCategoryBySlug(@Param('slug') slug: string) {
    const category = await this.servicesService.getCategoryBySlug(slug);
    return ResponseUtil.success(category);
  }

  /**
   * GET /api/v1/services
   * Get all services
   * Query params: category_id (optional)
   */
  @Get()
  async getAllServices(@Query('category_id') categoryId?: string) {
    const services = await this.servicesService.getAllServices(categoryId);
    return ResponseUtil.success(services);
  }

  /**
   * GET /api/v1/services/category/:categorySlug
   * Get services by category slug
   */
  @Get('category/:categorySlug')
  async getServicesByCategorySlug(@Param('categorySlug') categorySlug: string) {
    const services = await this.servicesService.getServicesByCategorySlug(categorySlug);
    return ResponseUtil.success(services);
  }

  /**
   * GET /api/v1/services/search?q=plumbing
   * Search services
   */
  @Get('search')
  async searchServices(@Query('q') query: string) {
    const services = await this.servicesService.searchServices(query);
    return ResponseUtil.success(services);
  }

  /**
   * GET /api/v1/services/popular
   * Get popular services
   */
  @Get('popular')
  async getPopularServices(@Query('limit') limit = 10) {
    const services = await this.servicesService.getPopularServices(limit);
    return ResponseUtil.success(services);
  }

  /**
   * GET /api/v1/services/:id
   * Get service by ID
   */
  @Get(':id')
  async getServiceById(@Param('id') id: string) {
    const service = await this.servicesService.getServiceById(id);
    return ResponseUtil.success(service);
  }

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * POST /api/v1/services/categories
   * Create new category (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('categories')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.servicesService.createCategory(createCategoryDto);
    return ResponseUtil.success(category, 'Category created successfully');
  }

  /**
   * PUT /api/v1/services/categories/:id
   * Update category (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateCategoryDto>,
  ) {
    const category = await this.servicesService.updateCategory(id, updateData);
    return ResponseUtil.success(category, 'Category updated successfully');
  }

  /**
   * DELETE /api/v1/services/categories/:id
   * Delete category (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.servicesService.deleteCategory(id);
    return ResponseUtil.success(null, 'Category deleted successfully');
  }

  /**
   * POST /api/v1/services
   * Create new service (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createService(@Body() createServiceDto: CreateServiceDto) {
    const service = await this.servicesService.createService(createServiceDto);
    return ResponseUtil.success(service, 'Service created successfully');
  }

  /**
   * PUT /api/v1/services/:id
   * Update service (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    const service = await this.servicesService.updateService(id, updateServiceDto);
    return ResponseUtil.success(service, 'Service updated successfully');
  }

  /**
   * DELETE /api/v1/services/:id
   * Delete service (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteService(@Param('id') id: string) {
    await this.servicesService.deleteService(id);
    return ResponseUtil.success(null, 'Service deleted successfully');
  }
}