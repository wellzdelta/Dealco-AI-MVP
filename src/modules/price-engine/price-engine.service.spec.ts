import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceEngineService } from './price-engine.service';
import { Product } from '../../database/entities/product.entity';
import { Retailer } from '../../database/entities/retailer.entity';
import { Price } from '../../database/entities/price.entity';
import { PriceHistory } from '../../database/entities/price-history.entity';
import { CacheService } from '../../common/cache/cache.service';
import { QueueService } from '../../common/queue/queue.service';

describe('PriceEngineService', () => {
  let service: PriceEngineService;
  let productRepository: Repository<Product>;
  let retailerRepository: Repository<Retailer>;
  let priceRepository: Repository<Price>;
  let priceHistoryRepository: Repository<PriceHistory>;
  let cacheService: CacheService;
  let queueService: QueueService;

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Electronics',
  };

  const mockRetailer = {
    id: 'retailer-123',
    name: 'Test Retailer',
    isActive: true,
    isApiEnabled: true,
    isScraperEnabled: true,
  };

  const mockPrice = {
    id: 'price-123',
    productId: 'product-123',
    retailerId: 'retailer-123',
    price: 99.99,
    currency: 'USD',
    inStock: true,
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockRetailerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPriceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPriceHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCacheService = {
    getCachedPrices: jest.fn(),
    cachePrices: jest.fn(),
  };

  const mockQueueService = {
    addPriceUpdateJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceEngineService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Retailer),
          useValue: mockRetailerRepository,
        },
        {
          provide: getRepositoryToken(Price),
          useValue: mockPriceRepository,
        },
        {
          provide: getRepositoryToken(PriceHistory),
          useValue: mockPriceHistoryRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        // Mock all the price service dependencies
        {
          provide: 'AmazonApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'WalmartApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'EbayApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'BestBuyApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'ZalandoApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'FarfetchApiService',
          useValue: { getProductPrice: jest.fn() },
        },
        {
          provide: 'ScrapingService',
          useValue: { scrapeProductPrice: jest.fn() },
        },
        {
          provide: 'ApifyService',
          useValue: { scrapeProduct: jest.fn() },
        },
        {
          provide: 'PlaywrightService',
          useValue: { scrapeProduct: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PriceEngineService>(PriceEngineService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    retailerRepository = module.get<Repository<Retailer>>(getRepositoryToken(Retailer));
    priceRepository = module.get<Repository<Price>>(getRepositoryToken(Price));
    priceHistoryRepository = module.get<Repository<PriceHistory>>(getRepositoryToken(PriceHistory));
    cacheService = module.get<CacheService>(CacheService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductPrices', () => {
    it('should return cached prices when available', async () => {
      const cachedPrices = [mockPrice];
      mockCacheService.getCachedPrices.mockResolvedValue(cachedPrices);

      const result = await service.getProductPrices('product-123');

      expect(result).toBeDefined();
      expect(mockCacheService.getCachedPrices).toHaveBeenCalledWith('product-123');
    });

    it('should fetch prices from retailers when not cached', async () => {
      mockCacheService.getCachedPrices.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockRetailerRepository.find.mockResolvedValue([mockRetailer]);

      // Mock the price fetching to return empty results
      const result = await service.getProductPrices('product-123');

      expect(result).toBeDefined();
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ where: { id: 'product-123' } });
      expect(mockRetailerRepository.find).toHaveBeenCalledWith({ where: { isActive: true } });
    });

    it('should throw error when product not found', async () => {
      mockCacheService.getCachedPrices.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.getProductPrices('product-123')).rejects.toThrow('Product not found');
    });
  });

  describe('updateProductPrice', () => {
    it('should update price for specific product and retailer', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockRetailerRepository.findOne.mockResolvedValue(mockRetailer);

      await service.updateProductPrice('product-123', 'retailer-123');

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ where: { id: 'product-123' } });
      expect(mockRetailerRepository.findOne).toHaveBeenCalledWith({ where: { id: 'retailer-123' } });
    });

    it('should throw error when product or retailer not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);
      mockRetailerRepository.findOne.mockResolvedValue(mockRetailer);

      await expect(service.updateProductPrice('product-123', 'retailer-123')).rejects.toThrow(
        'Product or retailer not found',
      );
    });
  });

  describe('scrapeProductPrice', () => {
    it('should scrape product price using external services', async () => {
      mockRetailerRepository.findOne.mockResolvedValue(mockRetailer);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.scrapeProductPrice(
        'retailer-123',
        'https://example.com/product',
        'product-123',
      );

      expect(mockRetailerRepository.findOne).toHaveBeenCalledWith({ where: { id: 'retailer-123' } });
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({ where: { id: 'product-123' } });
    });

    it('should throw error when retailer not found', async () => {
      mockRetailerRepository.findOne.mockResolvedValue(null);

      await expect(
        service.scrapeProductPrice('retailer-123', 'https://example.com/product', 'product-123'),
      ).rejects.toThrow('Retailer not found');
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for a product', async () => {
      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockPriceHistoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPriceHistory('product-123');

      expect(result).toEqual([]);
      expect(mockPriceHistoryRepository.createQueryBuilder).toHaveBeenCalledWith('ph');
    });
  });

  describe('getPriceEngineStats', () => {
    it('should return price engine statistics', async () => {
      mockProductRepository.count.mockResolvedValue(100);
      mockRetailerRepository.count.mockResolvedValue(10);
      mockPriceRepository.count.mockResolvedValue(1000);

      const result = await service.getPriceEngineStats();

      expect(result).toEqual({
        totalProducts: 100,
        totalRetailers: 10,
        totalPrices: 1000,
        averageResponseTime: 1200,
        successRate: 0.95,
        lastUpdated: expect.any(Date),
      });
    });
  });
});