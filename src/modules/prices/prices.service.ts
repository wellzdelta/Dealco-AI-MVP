import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Price } from '../../database/entities/price.entity';
import { PriceHistory } from '../../database/entities/price-history.entity';
import { Product } from '../../database/entities/product.entity';
import { Retailer } from '../../database/entities/retailer.entity';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { CacheService } from '../../common/cache/cache.service';

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Retailer)
    private readonly retailerRepository: Repository<Retailer>,
    private readonly priceEngineService: PriceEngineService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Get prices for a product
   */
  async getProductPrices(productId: string): Promise<any> {
    try {
      this.logger.log(`Getting prices for product: ${productId}`);

      // Check cache first
      const cachedPrices = await this.cacheService.getCachedPrices(productId);
      if (cachedPrices) {
        this.logger.log(`Cache hit for product prices: ${productId}`);
        return cachedPrices;
      }

      // Get from price engine
      const priceComparison = await this.priceEngineService.getProductPrices(productId);

      // Cache results
      await this.cacheService.cachePrices(productId, priceComparison.prices);

      return priceComparison;
    } catch (error) {
      this.logger.error(`Failed to get prices for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get price by ID
   */
  async findById(id: string): Promise<Price | null> {
    try {
      return await this.priceRepository.findOne({
        where: { id },
        relations: ['product', 'retailer'],
      });
    } catch (error) {
      this.logger.error(`Failed to find price by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Get prices by product ID
   */
  async findByProductId(productId: string): Promise<Price[]> {
    try {
      return await this.priceRepository.find({
        where: { productId },
        relations: ['retailer'],
        order: { price: 'ASC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find prices for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Get prices by retailer ID
   */
  async findByRetailerId(retailerId: string): Promise<Price[]> {
    try {
      return await this.priceRepository.find({
        where: { retailerId },
        relations: ['product'],
        order: { updatedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Failed to find prices for retailer ${retailerId}:`, error);
      return [];
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string, retailerId?: string, days = 30): Promise<PriceHistory[]> {
    try {
      return await this.priceEngineService.getPriceHistory(productId, retailerId, days);
    } catch (error) {
      this.logger.error(`Failed to get price history for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get lowest prices across all retailers
   */
  async getLowestPrices(limit = 50): Promise<Price[]> {
    try {
      return await this.priceRepository
        .createQueryBuilder('price')
        .leftJoinAndSelect('price.product', 'product')
        .leftJoinAndSelect('price.retailer', 'retailer')
        .where('price.inStock = :inStock', { inStock: true })
        .orderBy('price.price', 'ASC')
        .limit(limit)
        .getMany();
    } catch (error) {
      this.logger.error('Failed to get lowest prices:', error);
      return [];
    }
  }

  /**
   * Get price alerts
   */
  async getPriceAlerts(): Promise<any[]> {
    try {
      return await this.priceEngineService.getPriceAlerts();
    } catch (error) {
      this.logger.error('Failed to get price alerts:', error);
      return [];
    }
  }

  /**
   * Update price
   */
  async updatePrice(id: string, updateData: Partial<Price>): Promise<Price> {
    try {
      const price = await this.findById(id);
      if (!price) {
        throw new NotFoundException(`Price with ID ${id} not found`);
      }

      Object.assign(price, updateData);
      const updatedPrice = await this.priceRepository.save(price);

      this.logger.log(`Price updated: ${updatedPrice.id}`);
      return updatedPrice;
    } catch (error) {
      this.logger.error(`Failed to update price ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete price
   */
  async deletePrice(id: string): Promise<void> {
    try {
      const price = await this.findById(id);
      if (!price) {
        throw new NotFoundException(`Price with ID ${id} not found`);
      }

      await this.priceRepository.remove(price);

      this.logger.log(`Price deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete price ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get price statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalPrices = await this.priceRepository.count();
      const inStockPrices = await this.priceRepository.count({ where: { inStock: true } });
      const outOfStockPrices = await this.priceRepository.count({ where: { inStock: false } });

      const averagePrice = await this.priceRepository
        .createQueryBuilder('price')
        .select('AVG(price.price)', 'average')
        .getRawOne();

      const lowestPrice = await this.priceRepository
        .createQueryBuilder('price')
        .select('MIN(price.price)', 'lowest')
        .getRawOne();

      const highestPrice = await this.priceRepository
        .createQueryBuilder('price')
        .select('MAX(price.price)', 'highest')
        .getRawOne();

      const priceRanges = await this.priceRepository
        .createQueryBuilder('price')
        .select('CASE ' +
          'WHEN price.price < 25 THEN \'Under $25\' ' +
          'WHEN price.price < 50 THEN \'$25-$50\' ' +
          'WHEN price.price < 100 THEN \'$50-$100\' ' +
          'WHEN price.price < 250 THEN \'$100-$250\' ' +
          'ELSE \'Over $250\' ' +
          'END', 'range')
        .addSelect('COUNT(*)', 'count')
        .groupBy('range')
        .getRawMany();

      return {
        totalPrices,
        inStockPrices,
        outOfStockPrices,
        averagePrice: parseFloat(averagePrice.average) || 0,
        lowestPrice: parseFloat(lowestPrice.lowest) || 0,
        highestPrice: parseFloat(highestPrice.highest) || 0,
        priceRanges,
      };
    } catch (error) {
      this.logger.error('Failed to get price stats:', error);
      return null;
    }
  }

  /**
   * Get trending products (products with recent price changes)
   */
  async getTrendingProducts(limit = 20): Promise<any[]> {
    try {
      const trendingProducts = await this.priceRepository
        .createQueryBuilder('price')
        .leftJoinAndSelect('price.product', 'product')
        .leftJoinAndSelect('price.retailer', 'retailer')
        .where('price.updatedAt >= :date', { 
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        })
        .orderBy('price.updatedAt', 'DESC')
        .limit(limit)
        .getMany();

      return trendingProducts;
    } catch (error) {
      this.logger.error('Failed to get trending products:', error);
      return [];
    }
  }

  /**
   * Get price comparison for multiple products
   */
  async comparePrices(productIds: string[]): Promise<any> {
    try {
      const comparisons = await Promise.all(
        productIds.map(id => this.getProductPrices(id))
      );

      return {
        products: comparisons,
        totalProducts: productIds.length,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to compare prices:', error);
      throw error;
    }
  }
}