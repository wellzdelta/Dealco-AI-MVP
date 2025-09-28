import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceEngineService } from '../interfaces/price-engine.interface';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class BestBuyApiService implements PriceEngineService {
  private readonly logger = new Logger(BestBuyApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.bestbuy.com/v1';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BEST_BUY_API_KEY');
  }

  /**
   * Get product price from Best Buy API
   */
  async getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('Best Buy API not configured');
        return null;
      }

      this.logger.log(`Fetching price from Best Buy for product: ${product.name}`);

      // Search for product using Best Buy API
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
        currency: 'USD',
        originalPrice: priceInfo.originalPrice,
        discount: priceInfo.discount,
        discountPercentage: priceInfo.discountPercentage,
        productUrl: item.url,
        imageUrl: item.image,
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
          confidence: 0.88,
          lastVerified: new Date(),
          dataQuality: 'high',
        },
      };

      this.logger.log(`Successfully fetched Best Buy price: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch Best Buy price:', error);
      return null;
    }
  }

  /**
   * Search for product using Best Buy API
   */
  private async searchProduct(product: Product): Promise<any> {
    try {
      const searchQuery = `${product.brand} ${product.name}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `${this.baseUrl}/products(search="${encodedQuery}")?format=json&apiKey=${this.apiKey}&show=sku,name,salePrice,regularPrice,url,image,onSale,onlineAvailability,shipping,customerReviewAverage,customerReviewCount`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Best Buy API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Best Buy search failed:', error);
      throw error;
    }
  }

  /**
   * Extract price information from Best Buy response
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
      const price = productDetails.salePrice || productDetails.regularPrice;
      if (!price) {
        return null;
      }

      const currentPrice = parseFloat(price);
      const originalPrice = productDetails.regularPrice ? parseFloat(productDetails.regularPrice) : undefined;
      const inStock = productDetails.onlineAvailability === 'Available';
      const availabilityMessage = inStock ? 'Available online' : 'Out of stock';

      // Calculate savings if available
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (originalPrice && originalPrice > currentPrice) {
        discount = originalPrice - currentPrice;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract shipping cost
      const shippingCost = productDetails.shipping?.shippingCost ? 
        parseFloat(productDetails.shipping.shippingCost) : undefined;

      // Extract ratings
      const ratings = productDetails.customerReviewAverage ? {
        average: parseFloat(productDetails.customerReviewAverage),
        count: parseInt(productDetails.customerReviewCount || '0'),
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
        ratings,
      };
    } catch (error) {
      this.logger.error('Failed to extract price info:', error);
      return null;
    }
  }

  /**
   * Check if Best Buy API is configured
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
      this.logger.error('Best Buy API availability check failed:', error);
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
      this.logger.error('Best Buy API health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}