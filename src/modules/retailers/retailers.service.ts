import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Retailer } from '../../database/entities/retailer.entity';
import { CacheService } from '../../common/cache/cache.service';

export interface CreateRetailerDto {
  name: string;
  domain?: string;
  logo?: string;
  country?: string;
  currency?: string;
  apiConfig?: any;
  scraperConfig?: any;
  trustScore?: number;
  averageRating?: number;
  reviewCount?: number;
  shipping?: any;
  returnPolicy?: any;
}

export interface UpdateRetailerDto {
  name?: string;
  domain?: string;
  logo?: string;
  country?: string;
  currency?: string;
  apiConfig?: any;
  scraperConfig?: any;
  trustScore?: number;
  averageRating?: number;
  reviewCount?: number;
  shipping?: any;
  returnPolicy?: any;
  isActive?: boolean;
}

@Injectable()
export class RetailersService {
  private readonly logger = new Logger(RetailersService.name);

  constructor(
    @InjectRepository(Retailer)
    private readonly retailerRepository: Repository<Retailer>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new retailer
   */
  async create(createRetailerDto: CreateRetailerDto): Promise<Retailer> {
    try {
      this.logger.log(`Creating retailer: ${createRetailerDto.name}`);

      const retailer = this.retailerRepository.create(createRetailerDto);
      const savedRetailer = await this.retailerRepository.save(retailer);

      this.logger.log(`Retailer created: ${savedRetailer.id}`);
      return savedRetailer;
    } catch (error) {
      this.logger.error('Failed to create retailer:', error);
      throw error;
    }
  }

  /**
   * Find retailer by ID
   */
  async findById(id: string): Promise<Retailer | null> {
    try {
      return await this.retailerRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to find retailer by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find retailer by name
   */
  async findByName(name: string): Promise<Retailer | null> {
    try {
      return await this.retailerRepository.findOne({ where: { name } });
    } catch (error) {
      this.logger.error(`Failed to find retailer by name ${name}:`, error);
      return null;
    }
  }

  /**
   * Get all active retailers
   */
  async findActive(): Promise<Retailer[]> {
    try {
      return await this.retailerRepository.find({
        where: { isActive: true },
        order: { trustScore: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Failed to find active retailers:', error);
      return [];
    }
  }

  /**
   * Get all retailers
   */
  async findAll(page = 1, limit = 20): Promise<{ retailers: Retailer[]; total: number }> {
    try {
      const [retailers, total] = await this.retailerRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return { retailers, total };
    } catch (error) {
      this.logger.error('Failed to find all retailers:', error);
      throw error;
    }
  }

  /**
   * Update retailer
   */
  async update(id: string, updateRetailerDto: UpdateRetailerDto): Promise<Retailer> {
    try {
      const retailer = await this.findById(id);
      if (!retailer) {
        throw new NotFoundException(`Retailer with ID ${id} not found`);
      }

      Object.assign(retailer, updateRetailerDto);
      const updatedRetailer = await this.retailerRepository.save(retailer);

      this.logger.log(`Retailer updated: ${updatedRetailer.id}`);
      return updatedRetailer;
    } catch (error) {
      this.logger.error(`Failed to update retailer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete retailer
   */
  async delete(id: string): Promise<void> {
    try {
      const retailer = await this.findById(id);
      if (!retailer) {
        throw new NotFoundException(`Retailer with ID ${id} not found`);
      }

      await this.retailerRepository.remove(retailer);

      this.logger.log(`Retailer deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete retailer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update retailer health status
   */
  async updateHealthStatus(id: string, healthData: any): Promise<void> {
    try {
      const retailer = await this.findById(id);
      if (!retailer) {
        throw new NotFoundException(`Retailer with ID ${id} not found`);
      }

      const metadata = retailer.metadata || {};
      metadata.lastHealthCheck = new Date();
      metadata.errorCount = healthData.errorCount || 0;
      metadata.successCount = healthData.successCount || 0;
      metadata.averageResponseTime = healthData.averageResponseTime || 0;

      await this.retailerRepository.update(id, { metadata });

      // Cache health status
      await this.cacheService.cacheRetailerHealth(id, healthData);

      this.logger.log(`Health status updated for retailer: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to update health status for retailer ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get retailer health status
   */
  async getHealthStatus(id: string): Promise<any> {
    try {
      // Check cache first
      const cachedHealth = await this.cacheService.getCachedRetailerHealth(id);
      if (cachedHealth) {
        return cachedHealth;
      }

      const retailer = await this.findById(id);
      if (!retailer) {
        return null;
      }

      const healthStatus = {
        retailerId: id,
        retailerName: retailer.name,
        status: retailer.healthStatus,
        lastCheck: retailer.metadata?.lastHealthCheck || new Date(),
        errorCount: retailer.metadata?.errorCount || 0,
        successCount: retailer.metadata?.successCount || 0,
        averageResponseTime: retailer.metadata?.averageResponseTime || 0,
        apiEnabled: retailer.isApiEnabled,
        scraperEnabled: retailer.isScraperEnabled,
      };

      // Cache the result
      await this.cacheService.cacheRetailerHealth(id, healthStatus);

      return healthStatus;
    } catch (error) {
      this.logger.error(`Failed to get health status for retailer ${id}:`, error);
      return null;
    }
  }

  /**
   * Get all retailers health status
   */
  async getAllHealthStatus(): Promise<any[]> {
    try {
      const retailers = await this.findActive();
      const healthStatuses = await Promise.all(
        retailers.map(retailer => this.getHealthStatus(retailer.id))
      );

      return healthStatuses.filter(status => status !== null);
    } catch (error) {
      this.logger.error('Failed to get all retailers health status:', error);
      return [];
    }
  }

  /**
   * Get retailer statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalRetailers = await this.retailerRepository.count();
      const activeRetailers = await this.retailerRepository.count({ where: { isActive: true } });
      const apiEnabledRetailers = await this.retailerRepository
        .createQueryBuilder('retailer')
        .where('retailer.apiConfig->>\'hasApi\' = :hasApi', { hasApi: 'true' })
        .andWhere('retailer.isActive = :isActive', { isActive: true })
        .getCount();

      const scraperEnabledRetailers = await this.retailerRepository
        .createQueryBuilder('retailer')
        .where('retailer.scraperConfig->>\'enabled\' = :enabled', { enabled: 'true' })
        .andWhere('retailer.isActive = :isActive', { isActive: true })
        .getCount();

      const countries = await this.retailerRepository
        .createQueryBuilder('retailer')
        .select('retailer.country', 'country')
        .addSelect('COUNT(*)', 'count')
        .where('retailer.country IS NOT NULL')
        .groupBy('retailer.country')
        .orderBy('count', 'DESC')
        .getRawMany();

      return {
        totalRetailers,
        activeRetailers,
        apiEnabledRetailers,
        scraperEnabledRetailers,
        countries,
      };
    } catch (error) {
      this.logger.error('Failed to get retailer stats:', error);
      return null;
    }
  }
}