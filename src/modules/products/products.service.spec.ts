import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../database/entities/product.entity';
import { Price } from '../../database/entities/price.entity';
import { SearchService } from '../search/search.service';
import { CacheService } from '../../common/cache/cache.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let priceRepository: Repository<Price>;
  let searchService: SearchService;
  let cacheService: CacheService;

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'Electronics',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPriceRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockSearchService = {
    indexProduct: jest.fn(),
    removeProduct: jest.fn(),
    searchProducts: jest.fn(),
    getSuggestions: jest.fn(),
    getSimilarProducts: jest.fn(),
    bulkIndexProducts: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Price),
          useValue: mockPriceRepository,
        },
        {
          provide: SearchService,
          useValue: mockSearchService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    priceRepository = module.get<Repository<Price>>(getRepositoryToken(Price));
    searchService = module.get<SearchService>(SearchService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'Test Product',
        brand: 'Test Brand',
        category: 'Electronics',
      };

      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);
      mockSearchService.indexProduct.mockResolvedValue(undefined);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.create).toHaveBeenCalledWith(createProductDto);
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(mockSearchService.indexProduct).toHaveBeenCalledWith(mockProduct);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findById('product-123');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        relations: ['prices', 'prices.retailer'],
      });
    });

    it('should return null when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('product-123');

      expect(result).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('should search products using search service', async () => {
      const searchResults = {
        products: [mockProduct],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockSearchService.searchProducts.mockResolvedValue(searchResults);

      const result = await service.searchProducts('test query');

      expect(result).toEqual(searchResults);
      expect(mockSearchService.searchProducts).toHaveBeenCalledWith({
        query: 'test query',
        filters: undefined,
        pagination: { page: 1, limit: 20 },
      });
    });
  });

  describe('update', () => {
    it('should update product when found', async () => {
      const updateProductDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);
      mockSearchService.indexProduct.mockResolvedValue(undefined);

      const result = await service.update('product-123', updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        relations: ['prices', 'prices.retailer'],
      });
      expect(mockSearchService.indexProduct).toHaveBeenCalledWith(updatedProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update('product-123', { name: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete product when found', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.remove.mockResolvedValue(mockProduct);
      mockSearchService.removeProduct.mockResolvedValue(undefined);

      await service.delete('product-123');

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        relations: ['prices', 'prices.retailer'],
      });
      expect(mockProductRepository.remove).toHaveBeenCalledWith(mockProduct);
      expect(mockSearchService.removeProduct).toHaveBeenCalledWith('product-123');
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('product-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct];
      const total = 1;

      mockProductRepository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAll(1, 20);

      expect(result).toEqual({ products, total });
      expect(mockProductRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
        relations: ['prices', 'prices.retailer'],
      });
    });
  });

  describe('getStats', () => {
    it('should return product statistics', async () => {
      mockProductRepository.count
        .mockResolvedValueOnce(100) // totalProducts
        .mockResolvedValueOnce(95); // activeProducts

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(80), // productsWithPrices
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { category: 'Electronics', count: '50' },
          { category: 'Clothing', count: '30' },
        ]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStats();

      expect(result).toEqual({
        totalProducts: 100,
        activeProducts: 95,
        productsWithPrices: 80,
        categories: [
          { category: 'Electronics', count: '50' },
          { category: 'Clothing', count: '30' },
        ],
        brands: [
          { category: 'Electronics', count: '50' },
          { category: 'Clothing', count: '30' },
        ],
      });
    });
  });
});