import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceEngineService } from '../interfaces/price-engine.interface';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class FarfetchApiService implements PriceEngineService {
  private readonly logger = new Logger(FarfetchApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.farfetch.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FARFETCH_API_KEY');
  }

  /**
   * Get product price from Farfetch API
   */
  async getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('Farfetch API not configured');
        return null;
      }

      this.logger.log(`Fetching price from Farfetch for product: ${product.name}`);

      // Search for product using Farfetch API
      const searchResponse = await this.searchProduct(product);
      if (!searchResponse || !searchResponse.products || searchResponse.products.length === 0) {
        return null;
      }

      const item = searchResponse.products[0];
      if (!item) {
        return null;
      }

      // Extract price information
      const priceInfo = this.extractPriceInfo(item);
      if (!priceInfo) {
        return null;
      }

      const result: PriceResult = {
        productId: product.id,
        retailerId: retailer.id,
        price: priceInfo.price,
        currency: 'GBP',
        originalPrice: priceInfo.originalPrice,
        discount: priceInfo.discount,
        discountPercentage: priceInfo.discountPercentage,
        productUrl: item.url,
        imageUrl: item.images?.[0]?.url,
        inStock: priceInfo.inStock,
        stockQuantity: priceInfo.stockQuantity,
        shippingCost: priceInfo.shippingCost,
        estimatedDelivery: priceInfo.estimatedDelivery,
        availability: {
          status: priceInfo.inStock ? 'in_stock' : 'out_of_stock',
          message: priceInfo.availabilityMessage,
          lastChecked: new Date(),
        },
        promotions: priceInfo.promotions,
        ratings: priceInfo.ratings,
        metadata: {
          source: 'api',
          confidence: 0.86,
          lastVerified: new Date(),
          dataQuality: 'high',
        },
      };

      this.logger.log(`Successfully fetched Farfetch price: £${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch Farfetch price:', error);
      return null;
    }
  }

  /**
   * Search for product using Farfetch API
   */
  private async searchProduct(product: Product): Promise<any> {
    try {
      const searchQuery = `${product.brand} ${product.name}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `${this.baseUrl}/products?q=${encodedQuery}&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Farfetch API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Farfetch search failed:', error);
      throw error;
    }
  }

  /**
   * Extract price information from Farfetch response
   */
  private extractPriceInfo(productDetails: any): {
    price: number;
    originalPrice?: number;
    discount?: number;
    discountPercentage?: number;
    inStock: boolean;
    stockQuantity?: number;
    shippingCost?: number;
    estimatedDelivery?: string;
    availabilityMessage: string;
    promotions?: any[];
    ratings?: any;
  } | null {
    try {
      const price = productDetails.price?.value;
      if (!price) {
        return null;
      }

      const currentPrice = parseFloat(price);
      const originalPrice = productDetails.originalPrice?.value ? 
        parseFloat(productDetails.originalPrice.value) : undefined;
      const inStock = productDetails.availability?.isInStock || false;
      const availabilityMessage = inStock ? 'Available' : 'Out of stock';

      // Calculate savings if available
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (originalPrice && originalPrice > currentPrice) {
        discount = originalPrice - currentPrice;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract shipping cost
      const shippingCost = productDetails.shipping?.cost ? 
        parseFloat(productDetails.shipping.cost) : undefined;

      // Extract estimated delivery
      const estimatedDelivery = productDetails.shipping?.estimatedDelivery;

      // Extract ratings
      const ratings = productDetails.rating ? {
        average: parseFloat(productDetails.rating.average),
        count: parseInt(productDetails.rating.count || '0'),
        distribution: {
          five: 0,
          four: 0,
          three: 0,
          two: 0,
          one: 0,
        },
      } : undefined;

      return {
        price: currentPrice,
        originalPrice,
        discount,
        discountPercentage,
        inStock,
        availabilityMessage,
        shippingCost,
        estimatedDelivery,
        ratings,
      };
    } catch (error) {
      this.logger.error('Failed to extract price info:', error);
      return null;
    }
  }

  /**
   * Check if Farfetch API is configured
   */
  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        return false;
      }

      // Test with a simple search
      const testResponse = await this.searchProduct({ name: 'test', brand: 'test' } as Product);
      return !!testResponse;
    } catch (error) {
      this.logger.error('Farfetch API availability check failed:', error);
      return false;
    }
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      const isAvailable = await this.isAvailable();
      return {
        status: isAvailable ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Farfetch API health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}