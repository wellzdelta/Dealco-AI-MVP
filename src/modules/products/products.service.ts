import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { Price } from '../../database/entities/price.entity';
import { SearchService } from '../search/search.service';
import { CacheService } from '../../common/cache/cache.service';

export interface CreateProductDto {
  name: string;
  brand?: string;
  model?: string;
  sku?: string;
  upc?: string;
  ean?: string;
  isbn?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  specifications?: any;
  images?: any;
  attributes?: any;
}

export interface UpdateProductDto {
  name?: string;
  brand?: string;
  model?: string;
  sku?: string;
  upc?: string;
  ean?: string;
  isbn?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  specifications?: any;
  images?: any;
  attributes?: any;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly searchService: SearchService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      this.logger.log(`Creating product: ${createProductDto.name}`);

      const product = this.productRepository.create(createProductDto);
      const savedProduct = await this.productRepository.save(product);

      // Index in Elasticsearch
      await this.searchService.indexProduct(savedProduct);

      this.logger.log(`Product created: ${savedProduct.id}`);
      return savedProduct;
    } catch (error) {
      this.logger.error('Failed to create product:', error);
      throw error;
    }
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    try {
      return await this.productRepository.findOne({
        where: { id },
        relations: ['prices', 'prices.retailer'],
      });
    } catch (error) {
      this.logger.error(`Failed to find product by ID ${id}:`, error);
      return null;
    }
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    try {
      return await this.productRepository.findOne({
        where: { sku },
        relations: ['prices', 'prices.retailer'],
      });
    } catch (error) {
      this.logger.error(`Failed to find product by SKU ${sku}:`, error);
      return null;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: any, page = 1, limit = 20): Promise<any> {
    try {
      this.logger.log(`Searching products: ${query}`);

      const searchResults = await this.searchService.searchProducts({
        query,
        filters,
        pagination: { page, limit },
      });

      return searchResults;
    } catch (error) {
      this.logger.error('Product search failed:', error);
      throw error;
    }
  }

  /**
   * Get product suggestions
   */
  async getSuggestions(query: string, limit = 10): Promise<string[]> {
    try {
      return await this.searchService.getSuggestions(query, limit);
    } catch (error) {
      this.logger.error('Failed to get product suggestions:', error);
      return [];
    }
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(productId: string, limit = 10): Promise<Product[]> {
    try {
      return await this.searchService.getSimilarProducts(productId, limit);
    } catch (error) {
      this.logger.error(`Failed to get similar products for ${productId}:`, error);
      return [];
    }
  }

  /**
   * Update product
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      Object.assign(product, updateProductDto);
      const updatedProduct = await this.productRepository.save(product);

      // Update in Elasticsearch
      await this.searchService.indexProduct(updatedProduct);

      this.logger.log(`Product updated: ${updatedProduct.id}`);
      return updatedProduct;
    } catch (error) {
      this.logger.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    try {
      const product = await this.findById(id);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await this.productRepository.remove(product);

      // Remove from Elasticsearch
      await this.searchService.removeProduct(id);

      this.logger.log(`Product deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all products
   */
  async findAll(page = 1, limit = 20): Promise<{ products: Product[]; total: number }> {
    try {
      const [products, total] = await this.productRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['prices', 'prices.retailer'],
      });

      return { products, total };
    } catch (error) {
      this.logger.error('Failed to find all products:', error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async findByCategory(category: string, page = 1, limit = 20): Promise<{ products: Product[]; total: number }> {
    try {
      const [products, total] = await this.productRepository.findAndCount({
        where: { category },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['prices', 'prices.retailer'],
      });

      return { products, total };
    } catch (error) {
      this.logger.error(`Failed to find products by category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get products by brand
   */
  async findByBrand(brand: string, page = 1, limit = 20): Promise<{ products: Product[]; total: number }> {
    try {
      const [products, total] = await this.productRepository.findAndCount({
        where: { brand },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['prices', 'prices.retailer'],
      });

      return { products, total };
    } catch (error) {
      this.logger.error(`Failed to find products by brand ${brand}:`, error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalProducts = await this.productRepository.count();
      const activeProducts = await this.productRepository.count({ where: { isActive: true } });
      const productsWithPrices = await this.productRepository
        .createQueryBuilder('product')
        .innerJoin('product.prices', 'price')
        .getCount();

      const categories = await this.productRepository
        .createQueryBuilder('product')
        .select('product.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('product.category IS NOT NULL')
        .groupBy('product.category')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const brands = await this.productRepository
        .createQueryBuilder('product')
        .select('product.brand', 'brand')
        .addSelect('COUNT(*)', 'count')
        .where('product.brand IS NOT NULL')
        .groupBy('product.brand')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalProducts,
        activeProducts,
        productsWithPrices,
        categories,
        brands,
      };
    } catch (error) {
      this.logger.error('Failed to get product stats:', error);
      return null;
    }
  }

  /**
   * Bulk index products in Elasticsearch
   */
  async bulkIndexProducts(): Promise<void> {
    try {
      this.logger.log('Starting bulk index of products');

      const products = await this.productRepository.find({
        where: { isActive: true },
      });

      await this.searchService.bulkIndexProducts(products);

      this.logger.log(`Bulk indexed ${products.length} products`);
    } catch (error) {
      this.logger.error('Failed to bulk index products:', error);
      throw error;
    }
  }
}