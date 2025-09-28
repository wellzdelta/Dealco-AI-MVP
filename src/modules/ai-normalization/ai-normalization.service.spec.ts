import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiNormalizationService } from './ai-normalization.service';
import { Product } from '../../database/entities/product.entity';
import { ClaudeService } from './services/claude.service';
import { OpenAIService } from './services/openai.service';
import { CacheService } from '../../common/cache/cache.service';

describe('AiNormalizationService', () => {
  let service: AiNormalizationService;
  let claudeService: ClaudeService;
  let openaiService: OpenAIService;
  let cacheService: CacheService;

  const mockNormalizationRequest = {
    productName: 'Nike Air Force 1 White Low',
    brand: 'Nike',
    category: 'Footwear',
    description: 'Classic white sneakers',
  };

  const mockNormalizationResult = {
    normalizedName: 'Nike Air Force 1 Low White',
    normalizedBrand: 'Nike',
    normalizedCategory: 'Footwear',
    normalizedSubcategory: 'Sneakers',
    extractedAttributes: {
      color: 'White',
      style: 'Low',
    },
    confidence: 0.95,
    provider: 'claude' as const,
    processingTime: 1200,
    cacheHit: false,
  };

  const mockClaudeService = {
    normalizeProduct: jest.fn(),
    deduplicateProducts: jest.fn(),
  };

  const mockOpenAIService = {
    normalizeProduct: jest.fn(),
    deduplicateProducts: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockProductRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiNormalizationService,
        {
          provide: ClaudeService,
          useValue: mockClaudeService,
        },
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<AiNormalizationService>(AiNormalizationService);
    claudeService = module.get<ClaudeService>(ClaudeService);
    openaiService = module.get<OpenAIService>(OpenAIService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeProduct', () => {
    it('should return cached result when available', async () => {
      mockCacheService.get.mockResolvedValue(mockNormalizationResult);

      const result = await service.normalizeProduct(mockNormalizationRequest);

      expect(result).toEqual({
        ...mockNormalizationResult,
        cacheHit: true,
        processingTime: expect.any(Number),
      });
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should use Claude service when not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockClaudeService.normalizeProduct.mockResolvedValue(mockNormalizationResult);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.normalizeProduct(mockNormalizationRequest);

      expect(result).toEqual({
        ...mockNormalizationResult,
        cacheHit: false,
        processingTime: expect.any(Number),
      });
      expect(mockClaudeService.normalizeProduct).toHaveBeenCalledWith(mockNormalizationRequest);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should fallback to OpenAI when Claude fails', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockClaudeService.normalizeProduct.mockRejectedValue(new Error('Claude API error'));
      mockOpenAIService.normalizeProduct.mockResolvedValue({
        ...mockNormalizationResult,
        provider: 'openai',
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.normalizeProduct(mockNormalizationRequest);

      expect(result.provider).toBe('openai');
      expect(mockOpenAIService.normalizeProduct).toHaveBeenCalledWith(mockNormalizationRequest);
    });

    it('should throw error when both services fail', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockClaudeService.normalizeProduct.mockRejectedValue(new Error('Claude API error'));
      mockOpenAIService.normalizeProduct.mockRejectedValue(new Error('OpenAI API error'));

      await expect(service.normalizeProduct(mockNormalizationRequest)).rejects.toThrow(
        'AI normalization failed',
      );
    });
  });

  describe('deduplicateProducts', () => {
    const mockDeduplicationRequest = {
      products: [
        {
          id: 'product-1',
          name: 'Nike Air Force 1 White',
          brand: 'Nike',
          category: 'Footwear',
        },
        {
          id: 'product-2',
          name: 'Nike AF1 Low White',
          brand: 'Nike',
          category: 'Footwear',
        },
      ],
    };

    const mockDeduplicationResult = {
      groups: [
        {
          products: ['product-1', 'product-2'],
          representativeProduct: 'product-1',
          confidence: 0.95,
          reason: 'Same product with different naming conventions',
        },
      ],
      duplicates: [],
      processingTime: 0,
    };

    it('should return cached result when available', async () => {
      mockCacheService.get.mockResolvedValue(mockDeduplicationResult);

      const result = await service.deduplicateProducts(mockDeduplicationRequest);

      expect(result).toEqual({
        ...mockDeduplicationResult,
        processingTime: expect.any(Number),
      });
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should use Claude service when not cached', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockClaudeService.deduplicateProducts.mockResolvedValue(mockDeduplicationResult);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.deduplicateProducts(mockDeduplicationRequest);

      expect(result).toEqual({
        ...mockDeduplicationResult,
        processingTime: expect.any(Number),
      });
      expect(mockClaudeService.deduplicateProducts).toHaveBeenCalledWith(mockDeduplicationRequest);
      expect(mockCacheService.set).toHaveBeenCalled();
    });
  });

  describe('batchNormalizeProducts', () => {
    it('should normalize multiple products in parallel', async () => {
      const requests = [mockNormalizationRequest, mockNormalizationRequest];
      mockCacheService.get.mockResolvedValue(null);
      mockClaudeService.normalizeProduct.mockResolvedValue(mockNormalizationResult);
      mockCacheService.set.mockResolvedValue(undefined);

      const results = await service.batchNormalizeProducts(requests);

      expect(results).toHaveLength(2);
      expect(mockClaudeService.normalizeProduct).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateNormalizationRequest', () => {
    it('should return valid for correct request', () => {
      const result = service.validateNormalizationRequest(mockNormalizationRequest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for missing product name', () => {
      const invalidRequest = { ...mockNormalizationRequest, productName: '' };
      const result = service.validateNormalizationRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product name is required');
    });

    it('should return invalid for too long product name', () => {
      const invalidRequest = {
        ...mockNormalizationRequest,
        productName: 'a'.repeat(501),
      };
      const result = service.validateNormalizationRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Product name is too long (max 500 characters)');
    });
  });

  describe('getNormalizationStats', () => {
    it('should return normalization statistics', async () => {
      const result = await service.getNormalizationStats();

      expect(result).toEqual({
        claude: {
          enabled: expect.any(Boolean),
          lastUsed: expect.any(Date),
        },
        openai: {
          enabled: expect.any(Boolean),
          lastUsed: expect.any(Date),
        },
        preferredProvider: 'claude',
        cache: {
          hitRate: 0.65,
          totalRequests: 1000,
        },
        performance: {
          averageProcessingTime: 1200,
          successRate: 0.98,
        },
      });
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy when at least one service is available', async () => {
      const result = await service.getHealthStatus();

      expect(result.status).toBe('healthy');
      expect(result.lastCheck).toBeInstanceOf(Date);
    });
  });
});