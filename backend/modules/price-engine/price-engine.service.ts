import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceEngineService as BasePriceEngineService } from './interfaces/price-engine.interface';
import { AmazonApiService } from './services/amazon-api.service';
import { WalmartApiService } from './services/walmart-api.service';
import { EbayApiService } from './services/ebay-api.service';
import { BestBuyApiService } from './services/bestbuy-api.service';
import { ZalandoApiService } from './services/zalando-api.service';
import { FarfetchApiService } from './services/farfetch-api.service';
import { ScrapingService } from './services/scraping.service';
import { ApifyService } from './services/apify.service';
import { PlaywrightService } from './services/playwright.service';
import { CacheService } from '../../common/cache/cache.service';
import { QueueService } from '../../common/queue/queue.service';
import { Product } from '../../database/entities/product.entity';
import { Retailer } from '../../database/entities/retailer.entity';
import { Price } from '../../database/entities/price.entity';
import { PriceHistory } from '../../database/entities/price-history.entity';

export interface PriceResult {
  productId: string;
  retailerId: string;
  price: number;
  currency: string;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: number;
  productUrl: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
  shippingCost?: number;
  estimatedDelivery?: string;
  availability: {
    status: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order';
    message: string;
    lastChecked: Date;
  };
  promotions?: {
    type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping';
    value: number;
    description: string;
    validUntil: Date;
  }[];
  ratings?: {
    average: number;
    count: number;
    distribution: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };
  metadata: {
    source: 'api' | 'scraper' | 'manual';
    confidence: number;
    lastVerified: Date;
    dataQuality: 'high' | 'medium' | 'low';
  };
}

export interface PriceComparisonResult {
  product: Product;
  prices: PriceResult[];
  lowestPrice: PriceResult | null;
  highestPrice: PriceResult | null;
  averagePrice: number;
  totalRetailers: number;
  lastUpdated: Date;
}

@Injectable()
export class PriceEngineService {
  private readonly logger = new Logger(PriceEngineService.name);
  private readonly priceServices: Map<string, BasePriceEngineService> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Retailer)
    private readonly retailerRepository: Repository<Retailer>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(PriceHistory)
    private readonly priceHistoryRepository: Repository<PriceHistory>,
    private readonly amazonApiService: AmazonApiService,
    private readonly walmartApiService: WalmartApiService,
    private readonly ebayApiService: EbayApiService,
    private readonly bestBuyApiService: BestBuyApiService,
    private readonly zalandoApiService: ZalandoApiService,
    private readonly farfetchApiService: FarfetchApiService,
    private readonly scrapingService: ScrapingService,
    private readonly apifyService: ApifyService,
    private readonly playwrightService: PlaywrightService,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
  ) {
    this.initializePriceServices();
  }

  /**
   * Initialize price services
   */
  private initializePriceServices(): void {
    this.priceServices.set('amazon', this.amazonApiService);
    this.priceServices.set('walmart', this.walmartApiService);
    this.priceServices.set('ebay', this.ebayApiService);
    this.priceServices.set('bestbuy', this.bestBuyApiService);
    this.priceServices.set('zalando', this.zalandoApiService);
    this.priceServices.set('farfetch', this.farfetchApiService);
  }

  /**
   * Get prices for a product across all retailers
   */
  async getProductPrices(productId: string): Promise<PriceComparisonResult> {
    try {
      this.logger.log(`Getting prices for product ${productId}`);

      // Check cache first
      const cachedPrices = await this.cacheService.getCachedPrices(productId);
      if (cachedPrices) {
        this.logger.log(`Cache hit for product prices: ${productId}`);
        return this.buildPriceComparisonResult(productId, cachedPrices);
      }

      // Get product and active retailers
      const [product, retailers] = await Promise.all([
        this.productRepository.findOne({ where: { id: productId } }),
        this.retailerRepository.find({ where: { isActive: true } }),
      ]);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Fetch prices from all retailers in parallel
      const pricePromises = retailers.map(retailer => 
        this.fetchPriceFromRetailer(product, retailer)
      );

      const priceResults = await Promise.allSettled(pricePromises);
      const prices: PriceResult[] = [];

      // Process results
      for (let i = 0; i < priceResults.length; i++) {
        const result = priceResults[i];
        const retailer = retailers[i];

        if (result.status === 'fulfilled' && result.value) {
          prices.push(result.value);
        } else {
          this.logger.error(`Failed to fetch price from ${retailer.name}:`, 
            result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      }

      // Cache results
      await this.cacheService.cachePrices(productId, prices);

      // Save prices to database
      await this.savePricesToDatabase(prices);

      return this.buildPriceComparisonResult(productId, prices);
    } catch (error) {
      this.logger.error(`Failed to get prices for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch price from a specific retailer
   */
  private async fetchPriceFromRetailer(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      // Try API first if available
      if (retailer.isApiEnabled) {
        const apiService = this.priceServices.get(retailer.name.toLowerCase());
        if (apiService) {
          const apiResult = await apiService.getProductPrice(product, retailer);
          if (apiResult) {
            return apiResult;
          }
        }
      }

      // Fallback to scraping
      if (retailer.isScraperEnabled) {
        const scraperResult = await this.scrapingService.scrapeProductPrice(product, retailer);
        if (scraperResult) {
          return scraperResult;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to fetch price from ${retailer.name}:`, error);
      return null;
    }
  }

  /**
   * Update product price for a specific retailer
   */
  async updateProductPrice(productId: string, retailerId: string): Promise<void> {
    try {
      const [product, retailer] = await Promise.all([
        this.productRepository.findOne({ where: { id: productId } }),
        this.retailerRepository.findOne({ where: { id: retailerId } }),
      ]);

      if (!product || !retailer) {
        throw new Error(`Product or retailer not found: ${productId}, ${retailerId}`);
      }

      const priceResult = await this.fetchPriceFromRetailer(product, retailer);
      if (priceResult) {
        await this.savePriceToDatabase(priceResult);
        this.logger.log(`Updated price for product ${productId} at retailer ${retailerId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update price for product ${productId} at retailer ${retailerId}:`, error);
      throw error;
    }
  }

  /**
   * Scrape product price using external services
   */
  async scrapeProductPrice(retailerId: string, productUrl: string, productId: string): Promise<PriceResult | null> {
    try {
      const retailer = await this.retailerRepository.findOne({ where: { id: retailerId } });
      if (!retailer) {
        throw new Error(`Retailer not found: ${retailerId}`);
      }

      const product = await this.productRepository.findOne({ where: { id: productId } });
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      // Try different scraping methods
      const scrapingMethods = [
        () => this.apifyService.scrapeProduct(productUrl, retailer),
        () => this.playwrightService.scrapeProduct(productUrl, retailer),
        () => this.scrapingService.scrapeProductPrice(product, retailer),
      ];

      for (const method of scrapingMethods) {
        try {
          const result = await method();
          if (result) {
            return result;
          }
        } catch (error) {
          this.logger.warn(`Scraping method failed:`, error);
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to scrape product price:`, error);
      throw error;
    }
  }

  /**
   * Save prices to database
   */
  private async savePricesToDatabase(prices: PriceResult[]): Promise<void> {
    try {
      for (const priceData of prices) {
        await this.savePriceToDatabase(priceData);
      }
    } catch (error) {
      this.logger.error('Failed to save prices to database:', error);
      throw error;
    }
  }

  /**
   * Save single price to database
   */
  private async savePriceToDatabase(priceData: PriceResult): Promise<void> {
    try {
      // Update or create price record
      let price = await this.priceRepository.findOne({
        where: {
          productId: priceData.productId,
          retailerId: priceData.retailerId,
        },
      });

      if (price) {
        // Update existing price
        price.price = priceData.price;
        price.currency = priceData.currency;
        price.originalPrice = priceData.originalPrice;
        price.discount = priceData.discount;
        price.discountPercentage = priceData.discountPercentage;
        price.productUrl = priceData.productUrl;
        price.imageUrl = priceData.imageUrl;
        price.inStock = priceData.inStock;
        price.stockQuantity = priceData.stockQuantity;
        price.shippingCost = priceData.shippingCost;
        price.estimatedDelivery = priceData.estimatedDelivery;
        price.availability = priceData.availability;
        price.promotions = priceData.promotions;
        price.ratings = priceData.ratings;
        price.metadata = priceData.metadata;
        price.updatedAt = new Date();
      } else {
        // Create new price record
        price = this.priceRepository.create({
          productId: priceData.productId,
          retailerId: priceData.retailerId,
          price: priceData.price,
          currency: priceData.currency,
          originalPrice: priceData.originalPrice,
          discount: priceData.discount,
          discountPercentage: priceData.discountPercentage,
          productUrl: priceData.productUrl,
          imageUrl: priceData.imageUrl,
          inStock: priceData.inStock,
          stockQuantity: priceData.stockQuantity,
          shippingCost: priceData.shippingCost,
          estimatedDelivery: priceData.estimatedDelivery,
          availability: priceData.availability,
          promotions: priceData.promotions,
          ratings: priceData.ratings,
          metadata: priceData.metadata,
        });
      }

      await this.priceRepository.save(price);

      // Save to price history
      const priceHistory = this.priceHistoryRepository.create({
        productId: priceData.productId,
        retailerId: priceData.retailerId,
        price: priceData.price,
        currency: priceData.currency,
        originalPrice: priceData.originalPrice,
        inStock: priceData.inStock,
        stockQuantity: priceData.stockQuantity,
        shippingCost: priceData.shippingCost,
        promotions: priceData.promotions,
        metadata: priceData.metadata,
      });

      await this.priceHistoryRepository.save(priceHistory);
    } catch (error) {
      this.logger.error('Failed to save price to database:', error);
      throw error;
    }
  }

  /**
   * Build price comparison result
   */
  private buildPriceComparisonResult(productId: string, prices: PriceResult[]): PriceComparisonResult {
    const lowestPrice = prices.reduce((lowest, current) => 
      current.price < lowest.price ? current : lowest, prices[0]);
    
    const highestPrice = prices.reduce((highest, current) => 
      current.price > highest.price ? current : highest, prices[0]);

    const averagePrice = prices.reduce((sum, price) => sum + price.price, 0) / prices.length;

    return {
      product: { id: productId } as Product,
      prices,
      lowestPrice: lowestPrice || null,
      highestPrice: highestPrice || null,
      averagePrice,
      totalRetailers: prices.length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(productId: string, retailerId?: string, days = 30): Promise<PriceHistory[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = this.priceHistoryRepository
        .createQueryBuilder('ph')
        .where('ph.productId = :productId', { productId })
        .andWhere('ph.createdAt >= :startDate', { startDate })
        .orderBy('ph.createdAt', 'DESC');

      if (retailerId) {
        query.andWhere('ph.retailerId = :retailerId', { retailerId });
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to get price history for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get price alerts for users
   */
  async getPriceAlerts(): Promise<any[]> {
    try {
      // TODO: Implement price alerts logic
      // This would check for products that have dropped below user-set thresholds
      return [];
    } catch (error) {
      this.logger.error('Failed to get price alerts:', error);
      throw error;
    }
  }

  /**
   * Get price engine statistics
   */
  async getPriceEngineStats(): Promise<any> {
    try {
      const stats = {
        totalProducts: await this.productRepository.count(),
        totalRetailers: await this.retailerRepository.count({ where: { isActive: true } }),
        totalPrices: await this.priceRepository.count(),
        averageResponseTime: 1200, // This would be calculated from actual metrics
        successRate: 0.95, // This would be calculated from actual metrics
        lastUpdated: new Date(),
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to get price engine stats:', error);
      return null;
    }
  }
}