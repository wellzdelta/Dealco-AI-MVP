import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeService } from './services/claude.service';
import { OpenAIService } from './services/openai.service';
import { CacheService } from '../../common/cache/cache.service';
import { Product } from '../../database/entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

export interface NormalizationRequest {
  productName: string;
  brand?: string;
  category?: string;
  description?: string;
  specifications?: any;
  attributes?: any;
  rawData?: any;
}

export interface NormalizationResult {
  normalizedName: string;
  normalizedBrand: string;
  normalizedCategory: string;
  normalizedSubcategory?: string;
  extractedAttributes: {
    color?: string;
    size?: string;
    material?: string;
    gender?: string;
    ageGroup?: string;
    season?: string;
    style?: string;
    [key: string]: any;
  };
  confidence: number;
  provider: 'claude' | 'openai';
  processingTime: number;
  cacheHit: boolean;
}

export interface DeduplicationRequest {
  products: Array<{
    id: string;
    name: string;
    brand: string;
    category: string;
    specifications?: any;
    attributes?: any;
  }>;
}

export interface DeduplicationResult {
  groups: Array<{
    products: string[];
    representativeProduct: string;
    confidence: number;
    reason: string;
  }>;
  duplicates: Array<{
    product1: string;
    product2: string;
    confidence: number;
    reason: string;
  }>;
  processingTime: number;
}

@Injectable()
export class AiNormalizationService {
  private readonly logger = new Logger(AiNormalizationService.name);
  private readonly preferredProvider: 'claude' | 'openai';

  constructor(
    private readonly configService: ConfigService,
    private readonly claudeService: ClaudeService,
    private readonly openaiService: OpenAIService,
    private readonly cacheService: CacheService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    this.preferredProvider = this.configService.get<string>('PREFERRED_AI_PROVIDER', 'claude') as 'claude' | 'openai';
  }

  /**
   * Normalize product information using AI
   */
  async normalizeProduct(request: NormalizationRequest): Promise<NormalizationResult> {
    const startTime = Date.now();
    this.logger.log(`Normalizing product: ${request.productName}`);

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      const cachedResult = await this.cacheService.get<NormalizationResult>(`normalization:${cacheKey}`);
      if (cachedResult) {
        this.logger.log(`Cache hit for product normalization: ${cacheKey}`);
        return {
          ...cachedResult,
          cacheHit: true,
          processingTime: Date.now() - startTime,
        };
      }

      // Try preferred provider first
      let result: NormalizationResult | null = null;
      let provider: 'claude' | 'openai' = this.preferredProvider;

      try {
        if (this.preferredProvider === 'claude') {
          result = await this.claudeService.normalizeProduct(request);
        } else {
          result = await this.openaiService.normalizeProduct(request);
        }
      } catch (error) {
        this.logger.warn(`Primary AI provider failed, trying fallback: ${error.message}`);
        
        // Try fallback provider
        try {
          if (this.preferredProvider === 'claude') {
            result = await this.openaiService.normalizeProduct(request);
            provider = 'openai';
          } else {
            result = await this.claudeService.normalizeProduct(request);
            provider = 'claude';
          }
        } catch (fallbackError) {
          this.logger.error('Both AI providers failed:', fallbackError);
          throw new Error('AI normalization failed');
        }
      }

      if (!result) {
        throw new Error('AI normalization returned null result');
      }

      // Add metadata
      result.provider = provider;
      result.processingTime = Date.now() - startTime;
      result.cacheHit = false;

      // Cache result
      await this.cacheService.set(`normalization:${cacheKey}`, result, 3600); // 1 hour TTL

      this.logger.log(`Product normalization completed in ${result.processingTime}ms`);
      return result;
    } catch (error) {
      this.logger.error('Product normalization failed:', error);
      throw error;
    }
  }

  /**
   * Deduplicate products using AI
   */
  async deduplicateProducts(request: DeduplicationRequest): Promise<DeduplicationResult> {
    const startTime = Date.now();
    this.logger.log(`Deduplicating ${request.products.length} products`);

    try {
      // Generate cache key
      const cacheKey = this.generateDeduplicationCacheKey(request);
      
      // Check cache first
      const cachedResult = await this.cacheService.get<DeduplicationResult>(`deduplication:${cacheKey}`);
      if (cachedResult) {
        this.logger.log(`Cache hit for product deduplication: ${cacheKey}`);
        return {
          ...cachedResult,
          processingTime: Date.now() - startTime,
        };
      }

      // Try preferred provider first
      let result: DeduplicationResult | null = null;
      let provider: 'claude' | 'openai' = this.preferredProvider;

      try {
        if (this.preferredProvider === 'claude') {
          result = await this.claudeService.deduplicateProducts(request);
        } else {
          result = await this.openaiService.deduplicateProducts(request);
        }
      } catch (error) {
        this.logger.warn(`Primary AI provider failed for deduplication, trying fallback: ${error.message}`);
        
        // Try fallback provider
        try {
          if (this.preferredProvider === 'claude') {
            result = await this.openaiService.deduplicateProducts(request);
            provider = 'openai';
          } else {
            result = await this.claudeService.deduplicateProducts(request);
            provider = 'claude';
          }
        } catch (fallbackError) {
          this.logger.error('Both AI providers failed for deduplication:', fallbackError);
          throw new Error('AI deduplication failed');
        }
      }

      if (!result) {
        throw new Error('AI deduplication returned null result');
      }

      // Add metadata
      result.processingTime = Date.now() - startTime;

      // Cache result
      await this.cacheService.set(`deduplication:${cacheKey}`, result, 1800); // 30 minutes TTL

      this.logger.log(`Product deduplication completed in ${result.processingTime}ms`);
      return result;
    } catch (error) {
      this.logger.error('Product deduplication failed:', error);
      throw error;
    }
  }

  /**
   * Batch normalize multiple products
   */
  async batchNormalizeProducts(requests: NormalizationRequest[]): Promise<NormalizationResult[]> {
    this.logger.log(`Batch normalizing ${requests.length} products`);

    try {
      // Process in parallel with concurrency limit
      const concurrencyLimit = 5;
      const results: NormalizationResult[] = [];

      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        const batch = requests.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map(request => this.normalizeProduct(request))
        );
        results.push(...batchResults);
      }

      this.logger.log(`Batch normalization completed for ${results.length} products`);
      return results;
    } catch (error) {
      this.logger.error('Batch normalization failed:', error);
      throw error;
    }
  }

  /**
   * Get normalization statistics
   */
  async getNormalizationStats(): Promise<any> {
    try {
      const stats = {
        claude: {
          enabled: this.claudeService.isConfigured(),
          lastUsed: new Date(),
        },
        openai: {
          enabled: this.openaiService.isConfigured(),
          lastUsed: new Date(),
        },
        preferredProvider: this.preferredProvider,
        cache: {
          hitRate: 0.65, // This would be calculated from actual cache stats
          totalRequests: 1000,
        },
        performance: {
          averageProcessingTime: 1200, // This would be calculated from actual metrics
          successRate: 0.98,
        },
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to get normalization stats:', error);
      return null;
    }
  }

  /**
   * Generate cache key for normalization request
   */
  private generateCacheKey(request: NormalizationRequest): string {
    const data = {
      productName: request.productName,
      brand: request.brand,
      category: request.category,
      description: request.description,
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate cache key for deduplication request
   */
  private generateDeduplicationCacheKey(request: DeduplicationRequest): string {
    const productIds = request.products.map(p => p.id).sort();
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(productIds))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Validate normalization request
   */
  validateNormalizationRequest(request: NormalizationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.productName || request.productName.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (request.productName && request.productName.length > 500) {
      errors.push('Product name is too long (max 500 characters)');
    }

    if (request.brand && request.brand.length > 100) {
      errors.push('Brand name is too long (max 100 characters)');
    }

    if (request.category && request.category.length > 100) {
      errors.push('Category is too long (max 100 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      const claudeHealthy = this.claudeService.isConfigured();
      const openaiHealthy = this.openaiService.isConfigured();

      if (claudeHealthy || openaiHealthy) {
        return {
          status: 'healthy',
          lastCheck: new Date(),
        };
      } else {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
        };
      }
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}