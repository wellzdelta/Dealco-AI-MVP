import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleVisionService } from './services/google-vision.service';
import { RoboflowService } from './services/roboflow.service';
import { ImageProcessingService } from './services/image-processing.service';
import { CacheService } from '../../common/cache/cache.service';
import { QueueService } from '../../common/queue/queue.service';
import { SearchService } from '../search/search.service';
import { Product } from '../../database/entities/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';

export interface RecognitionResult {
  provider: 'google_vision' | 'roboflow' | 'manual';
  productName: string;
  brand: string;
  category: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rawResponse: any;
}

export interface ImageRecognitionResponse {
  scanId: string;
  results: RecognitionResult[];
  bestMatch: RecognitionResult | null;
  suggestedProducts: Product[];
  processingTime: number;
  cacheHit: boolean;
}

@Injectable()
export class ImageRecognitionService {
  private readonly logger = new Logger(ImageRecognitionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly googleVisionService: GoogleVisionService,
    private readonly roboflowService: RoboflowService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly cacheService: CacheService,
    private readonly queueService: QueueService,
    private readonly searchService: SearchService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Process image recognition for a scan
   */
  async processImageRecognition(
    scanId: string,
    imageUrl: string,
    imageHash: string,
    userId: string,
  ): Promise<ImageRecognitionResponse> {
    const startTime = Date.now();
    this.logger.log(`Processing image recognition for scan ${scanId}`);

    try {
      // Check cache first
      const cachedResults = await this.cacheService.getCachedImageRecognition(imageHash);
      if (cachedResults) {
        this.logger.log(`Cache hit for image recognition: ${imageHash}`);
        return {
          scanId,
          results: cachedResults,
          bestMatch: this.getBestMatch(cachedResults),
          suggestedProducts: await this.getSuggestedProducts(cachedResults),
          processingTime: Date.now() - startTime,
          cacheHit: true,
        };
      }

      // Process image with multiple providers
      const results = await this.recognizeImageWithMultipleProviders(imageUrl);

      // Cache results
      await this.cacheService.cacheImageRecognition(imageHash, results);

      // Get best match and suggested products
      const bestMatch = this.getBestMatch(results);
      const suggestedProducts = await this.getSuggestedProducts(results);

      const response: ImageRecognitionResponse = {
        scanId,
        results,
        bestMatch,
        suggestedProducts,
        processingTime: Date.now() - startTime,
        cacheHit: false,
      };

      this.logger.log(`Image recognition completed for scan ${scanId} in ${response.processingTime}ms`);
      return response;
    } catch (error) {
      this.logger.error(`Image recognition failed for scan ${scanId}:`, error);
      throw error;
    }
  }

  /**
   * Recognize image using multiple providers
   */
  private async recognizeImageWithMultipleProviders(imageUrl: string): Promise<RecognitionResult[]> {
    const results: RecognitionResult[] = [];

    try {
      // Process with Google Vision API
      const googleResults = await this.googleVisionService.recognizeProduct(imageUrl);
      if (googleResults) {
        results.push(googleResults);
      }
    } catch (error) {
      this.logger.error('Google Vision recognition failed:', error);
    }

    try {
      // Process with Roboflow
      const roboflowResults = await this.roboflowService.recognizeProduct(imageUrl);
      if (roboflowResults) {
        results.push(roboflowResults);
      }
    } catch (error) {
      this.logger.error('Roboflow recognition failed:', error);
    }

    // If no results from AI providers, create a fallback result
    if (results.length === 0) {
      results.push({
        provider: 'manual',
        productName: 'Unknown Product',
        brand: 'Unknown',
        category: 'Unknown',
        confidence: 0.1,
        rawResponse: { error: 'No recognition results' },
      });
    }

    return results;
  }

  /**
   * Get the best match from recognition results
   */
  private getBestMatch(results: RecognitionResult[]): RecognitionResult | null {
    if (results.length === 0) return null;

    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  /**
   * Get suggested products based on recognition results
   */
  private async getSuggestedProducts(results: RecognitionResult[]): Promise<Product[]> {
    if (results.length === 0) return [];

    const bestMatch = this.getBestMatch(results);
    if (!bestMatch || bestMatch.confidence < 0.3) return [];

    try {
      // Search for similar products
      const searchResults = await this.searchService.searchProducts({
        query: `${bestMatch.brand} ${bestMatch.productName}`,
        filters: {
          brand: bestMatch.brand,
          category: bestMatch.category,
        },
        pagination: {
          page: 1,
          limit: 10,
        },
      });

      return searchResults.products;
    } catch (error) {
      this.logger.error('Failed to get suggested products:', error);
      return [];
    }
  }

  /**
   * Validate image before processing
   */
  async validateImage(imageUrl: string): Promise<boolean> {
    try {
      const imageInfo = await this.imageProcessingService.getImageInfo(imageUrl);
      
      // Check image size and format
      if (imageInfo.size > 10 * 1024 * 1024) { // 10MB limit
        return false;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageInfo.format)) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Image validation failed:', error);
      return false;
    }
  }

  /**
   * Generate image hash for caching
   */
  generateImageHash(imageUrl: string): string {
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }

  /**
   * Get recognition statistics
   */
  async getRecognitionStats(): Promise<any> {
    try {
      const stats = {
        googleVision: {
          enabled: this.configService.get('GOOGLE_APPLICATION_CREDENTIALS') ? true : false,
          lastUsed: new Date(),
        },
        roboflow: {
          enabled: this.configService.get('ROBOFLOW_API_KEY') ? true : false,
          lastUsed: new Date(),
        },
        cache: {
          hitRate: 0.75, // This would be calculated from actual cache stats
          totalRequests: 1000,
        },
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to get recognition stats:', error);
      return null;
    }
  }
}