import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Product } from '../../database/entities/product.entity';
import { Retailer } from '../../database/entities/retailer.entity';
import { Price } from '../../database/entities/price.entity';
import { Scan } from '../../database/entities/scan.entity';
import { CacheService } from '../../common/cache/cache.service';
import { QueueService } from '../../common/queue/queue.service';
import { ImageRecognitionService } from '../image-recognition/image-recognition.service';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { AiNormalizationService } from '../ai-normalization/ai-normalization.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Retailer)
    private readonly retailerRepository: Repository<Retailer>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(Scan)
    private readonly scanRepository: Repository<Scan>,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly priceEngineService: PriceEngineService,
    private readonly aiNormalizationService: AiNormalizationService,
  ) {}

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    try {
      const healthChecks = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkQueueHealth(),
        this.checkImageRecognitionHealth(),
        this.checkPriceEngineHealth(),
        this.checkAiNormalizationHealth(),
      ]);

      const results = healthChecks.map((result, index) => {
        const services = [
          'database',
          'cache',
          'queue',
          'imageRecognition',
          'priceEngine',
          'aiNormalization',
        ];

        return {
          service: services[index],
          status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
          details: result.status === 'fulfilled' ? result.value : result.reason,
        };
      });

      const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: results,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    try {
      const [
        userStats,
        productStats,
        retailerStats,
        priceStats,
        scanStats,
        queueStats,
        cacheStats,
      ] = await Promise.all([
        this.getUserStats(),
        this.getProductStats(),
        this.getRetailerStats(),
        this.getPriceStats(),
        this.getScanStats(),
        this.getQueueStats(),
        this.getCacheStats(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        users: userStats,
        products: productStats,
        retailers: retailerStats,
        prices: priceStats,
        scans: scanStats,
        queues: queueStats,
        cache: cacheStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      this.logger.error('Failed to get system metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        responseTimes: {
          average: 1200, // This would be calculated from actual metrics
          p95: 2500,
          p99: 5000,
        },
        throughput: {
          requestsPerSecond: 150,
          requestsPerMinute: 9000,
          requestsPerHour: 540000,
        },
        errorRates: {
          total: 0.02, // 2%
          byService: {
            imageRecognition: 0.01,
            priceEngine: 0.03,
            aiNormalization: 0.01,
          },
        },
        cache: {
          hitRate: 0.75,
          missRate: 0.25,
          evictionRate: 0.05,
        },
        database: {
          connectionPool: {
            active: 5,
            idle: 15,
            total: 20,
          },
          queryPerformance: {
            averageQueryTime: 45,
            slowQueries: 12,
          },
        },
      };

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(limit = 100): Promise<any[]> {
    try {
      // In a real implementation, this would query your logging system
      // For now, return mock data
      return [
        {
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Failed to process image recognition',
          service: 'imageRecognition',
          userId: 'user-123',
          scanId: 'scan-456',
          stack: 'Error: API timeout\n    at ImageRecognitionService.processImageRecognition',
        },
        {
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'error',
          message: 'Price scraping failed',
          service: 'priceEngine',
          retailerId: 'retailer-789',
          productId: 'product-101',
          stack: 'Error: Network timeout\n    at ScrapingService.scrapeProductPrice',
        },
      ];
    } catch (error) {
      this.logger.error('Failed to get error logs:', error);
      return [];
    }
  }

  /**
   * Get audit trail
   */
  async getAuditTrail(limit = 100): Promise<any[]> {
    try {
      // In a real implementation, this would query your audit system
      // For now, return mock data
      return [
        {
          timestamp: new Date().toISOString(),
          action: 'user.login',
          userId: 'user-123',
          ipAddress: '192.168.1.100',
          userAgent: 'Dealco AI Mobile App/1.0.0',
          details: { success: true },
        },
        {
          timestamp: new Date(Date.now() - 600000).toISOString(),
          action: 'scan.create',
          userId: 'user-123',
          scanId: 'scan-456',
          details: { imageUrl: 'https://example.com/image.jpg' },
        },
        {
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          action: 'price.update',
          productId: 'product-101',
          retailerId: 'retailer-789',
          details: { oldPrice: 99.99, newPrice: 89.99 },
        },
      ];
    } catch (error) {
      this.logger.error('Failed to get audit trail:', error);
      return [];
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<any> {
    try {
      const userCount = await this.userRepository.count();
      const productCount = await this.productRepository.count();
      const retailerCount = await this.retailerRepository.count();
      const priceCount = await this.priceRepository.count();
      const scanCount = await this.scanRepository.count();

      return {
        status: 'healthy',
        tables: {
          users: userCount,
          products: productCount,
          retailers: retailerCount,
          prices: priceCount,
          scans: scanCount,
        },
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<any> {
    try {
      const stats = await this.cacheService.getStats();
      return {
        status: 'healthy',
        stats,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueueHealth(): Promise<any> {
    try {
      const stats = await this.queueService.getQueueStats();
      return {
        status: 'healthy',
        stats,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check image recognition health
   */
  private async checkImageRecognitionHealth(): Promise<any> {
    try {
      const stats = await this.imageRecognitionService.getRecognitionStats();
      return {
        status: 'healthy',
        stats,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check price engine health
   */
  private async checkPriceEngineHealth(): Promise<any> {
    try {
      const stats = await this.priceEngineService.getPriceEngineStats();
      return {
        status: 'healthy',
        stats,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Check AI normalization health
   */
  private async checkAiNormalizationHealth(): Promise<any> {
    try {
      const healthStatus = await this.aiNormalizationService.getHealthStatus();
      return {
        status: healthStatus.status,
        lastCheck: healthStatus.lastCheck,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastCheck: new Date().toISOString(),
      };
    }
  }

  /**
   * Get user statistics
   */
  private async getUserStats(): Promise<any> {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { isActive: true } });
      const verifiedUsers = await this.userRepository.count({ where: { isVerified: true } });

      return {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        unverified: totalUsers - verifiedUsers,
      };
    } catch (error) {
      this.logger.error('Failed to get user stats:', error);
      return null;
    }
  }

  /**
   * Get product statistics
   */
  private async getProductStats(): Promise<any> {
    try {
      const totalProducts = await this.productRepository.count();
      const activeProducts = await this.productRepository.count({ where: { isActive: true } });

      return {
        total: totalProducts,
        active: activeProducts,
      };
    } catch (error) {
      this.logger.error('Failed to get product stats:', error);
      return null;
    }
  }

  /**
   * Get retailer statistics
   */
  private async getRetailerStats(): Promise<any> {
    try {
      const totalRetailers = await this.retailerRepository.count();
      const activeRetailers = await this.retailerRepository.count({ where: { isActive: true } });

      return {
        total: totalRetailers,
        active: activeRetailers,
      };
    } catch (error) {
      this.logger.error('Failed to get retailer stats:', error);
      return null;
    }
  }

  /**
   * Get price statistics
   */
  private async getPriceStats(): Promise<any> {
    try {
      const totalPrices = await this.priceRepository.count();
      const inStockPrices = await this.priceRepository.count({ where: { inStock: true } });

      return {
        total: totalPrices,
        inStock: inStockPrices,
        outOfStock: totalPrices - inStockPrices,
      };
    } catch (error) {
      this.logger.error('Failed to get price stats:', error);
      return null;
    }
  }

  /**
   * Get scan statistics
   */
  private async getScanStats(): Promise<any> {
    try {
      const totalScans = await this.scanRepository.count();
      const completedScans = await this.scanRepository.count({ where: { status: 'completed' } });
      const failedScans = await this.scanRepository.count({ where: { status: 'failed' } });

      return {
        total: totalScans,
        completed: completedScans,
        failed: failedScans,
        successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get scan stats:', error);
      return null;
    }
  }

  /**
   * Get queue statistics
   */
  private async getQueueStats(): Promise<any> {
    try {
      return await this.queueService.getQueueStats();
    } catch (error) {
      this.logger.error('Failed to get queue stats:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  private async getCacheStats(): Promise<any> {
    try {
      return await this.cacheService.getStats();
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return null;
    }
  }
}