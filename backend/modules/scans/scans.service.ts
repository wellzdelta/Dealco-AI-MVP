import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan } from '../../database/entities/scan.entity';
import { Product } from '../../database/entities/product.entity';
import { User } from '../../database/entities/user.entity';
import { ImageRecognitionService } from '../image-recognition/image-recognition.service';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { QueueService } from '../../common/queue/queue.service';
import { CacheService } from '../../common/cache/cache.service';

export interface CreateScanDto {
  imageUrl: string;
  thumbnailUrl?: string;
  imageMetadata?: any;
}

export interface ScanResult {
  scan: Scan;
  recognitionResults?: any;
  suggestedProducts?: Product[];
  priceComparison?: any;
}

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

  constructor(
    @InjectRepository(Scan)
    private readonly scanRepository: Repository<Scan>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly priceEngineService: PriceEngineService,
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new scan
   */
  async createScan(userId: string, createScanDto: CreateScanDto): Promise<Scan> {
    try {
      this.logger.log(`Creating scan for user: ${userId}`);

      const scan = this.scanRepository.create({
        userId,
        imageUrl: createScanDto.imageUrl,
        thumbnailUrl: createScanDto.thumbnailUrl,
        imageMetadata: createScanDto.imageMetadata,
        status: 'pending',
        metadata: {
          userAgent: 'Dealco AI Mobile App',
          ipAddress: '127.0.0.1',
          deviceInfo: null,
          processingTime: 0,
          apiCalls: 0,
          scraperCalls: 0,
        },
      });

      const savedScan = await this.scanRepository.save(scan);

      // Queue image recognition job
      await this.queueService.addImageRecognitionJob({
        scanId: savedScan.id,
        imageUrl: createScanDto.imageUrl,
        imageHash: this.generateImageHash(createScanDto.imageUrl),
        userId,
      });

      this.logger.log(`Scan created: ${savedScan.id}`);
      return savedScan;
    } catch (error) {
      this.logger.error('Failed to create scan:', error);
      throw error;
    }
  }

  /**
   * Get scan by ID
   */
  async getScanById(scanId: string, userId: string): Promise<Scan | null> {
    try {
      return await this.scanRepository.findOne({
        where: { id: scanId, userId },
        relations: ['product', 'user'],
      });
    } catch (error) {
      this.logger.error(`Failed to get scan ${scanId}:`, error);
      return null;
    }
  }

  /**
   * Get user's scan history
   */
  async getUserScans(userId: string, page = 1, limit = 20): Promise<{ scans: Scan[]; total: number }> {
    try {
      const [scans, total] = await this.scanRepository.findAndCount({
        where: { userId },
        relations: ['product'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return { scans, total };
    } catch (error) {
      this.logger.error(`Failed to get scans for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Process image recognition for a scan
   */
  async processImageRecognition(
    scanId: string,
    imageUrl: string,
    imageHash: string,
    userId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing image recognition for scan: ${scanId}`);

      // Update scan status
      await this.updateScanStatus(scanId, 'processing');

      // Process image recognition
      const recognitionResponse = await this.imageRecognitionService.processImageRecognition(
        scanId,
        imageUrl,
        imageHash,
        userId,
      );

      // Update scan with recognition results
      await this.updateScanRecognitionResults(scanId, recognitionResponse);

      // If we have a best match, get price comparison
      if (recognitionResponse.bestMatch && recognitionResponse.suggestedProducts.length > 0) {
        const bestProduct = recognitionResponse.suggestedProducts[0];
        await this.getPriceComparison(scanId, bestProduct.id);
      }

      // Update scan status to completed
      await this.updateScanStatus(scanId, 'completed');

      this.logger.log(`Image recognition completed for scan: ${scanId}`);
    } catch (error) {
      this.logger.error(`Image recognition failed for scan ${scanId}:`, error);
      await this.updateScanError(scanId, error);
    }
  }

  /**
   * Get price comparison for a product
   */
  async getPriceComparison(scanId: string, productId: string): Promise<void> {
    try {
      this.logger.log(`Getting price comparison for scan ${scanId}, product ${productId}`);

      // Get price comparison
      const priceComparison = await this.priceEngineService.getProductPrices(productId);

      // Update scan with price results
      await this.updateScanPriceResults(scanId, priceComparison);

      this.logger.log(`Price comparison completed for scan: ${scanId}`);
    } catch (error) {
      this.logger.error(`Price comparison failed for scan ${scanId}:`, error);
    }
  }

  /**
   * Update scan status
   */
  async updateScanStatus(scanId: string, status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'): Promise<void> {
    try {
      await this.scanRepository.update(scanId, { status });
    } catch (error) {
      this.logger.error(`Failed to update scan status ${scanId}:`, error);
    }
  }

  /**
   * Update scan with recognition results
   */
  async updateScanRecognitionResults(scanId: string, recognitionResponse: any): Promise<void> {
    try {
      const updateData = {
        recognitionResults: recognitionResponse.results,
        confidenceScore: recognitionResponse.bestMatch?.confidence || 0,
        aiNormalization: recognitionResponse.bestMatch ? {
          normalizedName: recognitionResponse.bestMatch.productName,
          normalizedBrand: recognitionResponse.bestMatch.brand,
          normalizedCategory: recognitionResponse.bestMatch.category,
          confidence: recognitionResponse.bestMatch.confidence,
          provider: recognitionResponse.bestMatch.provider,
        } : null,
        searchResults: {
          totalFound: recognitionResponse.suggestedProducts.length,
          exactMatches: recognitionResponse.suggestedProducts.filter(p => p.confidenceScore > 0.8).length,
          similarMatches: recognitionResponse.suggestedProducts.filter(p => p.confidenceScore <= 0.8).length,
          searchTime: recognitionResponse.processingTime,
          searchQuery: recognitionResponse.bestMatch?.productName || '',
        },
        metadata: {
          processingTime: recognitionResponse.processingTime,
          apiCalls: 1,
          scraperCalls: 0,
        },
      };

      await this.scanRepository.update(scanId, updateData);
    } catch (error) {
      this.logger.error(`Failed to update scan recognition results ${scanId}:`, error);
    }
  }

  /**
   * Update scan with price results
   */
  async updateScanPriceResults(scanId: string, priceComparison: any): Promise<void> {
    try {
      const updateData = {
        priceResults: {
          totalPrices: priceComparison.prices.length,
          lowestPrice: priceComparison.lowestPrice?.price || 0,
          highestPrice: priceComparison.highestPrice?.price || 0,
          averagePrice: priceComparison.averagePrice || 0,
          retailers: priceComparison.prices.map(p => p.retailerId),
          lastUpdated: new Date(),
        },
        productId: priceComparison.product.id,
      };

      await this.scanRepository.update(scanId, updateData);
    } catch (error) {
      this.logger.error(`Failed to update scan price results ${scanId}:`, error);
    }
  }

  /**
   * Update scan with error
   */
  async updateScanError(scanId: string, error: any): Promise<void> {
    try {
      const updateData = {
        status: 'failed' as const,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error occurred',
          stack: error.stack,
          timestamp: new Date(),
        },
      };

      await this.scanRepository.update(scanId, updateData);
    } catch (updateError) {
      this.logger.error(`Failed to update scan error ${scanId}:`, updateError);
    }
  }

  /**
   * Add user feedback to scan
   */
  async addUserFeedback(
    scanId: string,
    userId: string,
    feedback: {
      isCorrect: boolean;
      correctProductId?: string;
      feedback: string;
    },
  ): Promise<void> {
    try {
      const scan = await this.getScanById(scanId, userId);
      if (!scan) {
        throw new NotFoundException(`Scan ${scanId} not found`);
      }

      const updateData = {
        userFeedback: {
          ...feedback,
          submittedAt: new Date(),
        },
      };

      await this.scanRepository.update(scanId, updateData);
      this.logger.log(`User feedback added to scan: ${scanId}`);
    } catch (error) {
      this.logger.error(`Failed to add user feedback to scan ${scanId}:`, error);
      throw error;
    }
  }

  /**
   * Get scan statistics
   */
  async getScanStats(userId?: string): Promise<any> {
    try {
      const whereClause = userId ? { userId } : {};
      
      const totalScans = await this.scanRepository.count({ where: whereClause });
      const completedScans = await this.scanRepository.count({ 
        where: { ...whereClause, status: 'completed' } 
      });
      const failedScans = await this.scanRepository.count({ 
        where: { ...whereClause, status: 'failed' } 
      });
      const pendingScans = await this.scanRepository.count({ 
        where: { ...whereClause, status: 'pending' } 
      });

      return {
        totalScans,
        completedScans,
        failedScans,
        pendingScans,
        successRate: totalScans > 0 ? (completedScans / totalScans) * 100 : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get scan stats:', error);
      return null;
    }
  }

  /**
   * Generate image hash for caching
   */
  private generateImageHash(imageUrl: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }
}