import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceEngineService } from '../interfaces/price-engine.interface';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class WalmartApiService implements PriceEngineService {
  private readonly logger = new Logger(WalmartApiService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://developer.walmartlabs.com/docs';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('WALMART_API_KEY');
  }

  /**
   * Get product price from Walmart API
   */
  async getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('Walmart API not configured');
        return null;
      }

      this.logger.log(`Fetching price from Walmart for product: ${product.name}`);

      // Search for product using Walmart API
      const searchResponse = await this.searchProduct(product);
      if (!searchResponse || !searchResponse.items || searchResponse.items.length === 0) {
        return null;
      }

      const item = searchResponse.items[0];
      if (!item) {
        return null;
      }

      // Get detailed product information
      const productResponse = await this.getProductDetails(item.itemId);
      if (!productResponse || !productResponse.item) {
        return null;
      }

      const productDetails = productResponse.item;
      
      // Extract price information
      const priceInfo = this.extractPriceInfo(productDetails);
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
        productUrl: productDetails.productUrl,
        imageUrl: productDetails.largeImage,
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
          confidence: 0.90,
          lastVerified: new Date(),
          dataQuality: 'high',
        },
      };

      this.logger.log(`Successfully fetched Walmart price: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch Walmart price:', error);
      return null;
    }
  }

  /**
   * Search for product using Walmart API
   */
  private async searchProduct(product: Product): Promise<any> {
    try {
      const searchQuery = `${product.brand} ${product.name}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `https://developer.walmartlabs.com/docs?api_key=${this.apiKey}&query=${encodedQuery}&format=json&numItems=1`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Walmart search failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed product information
   */
  private async getProductDetails(itemId: string): Promise<any> {
    try {
      const url = `https://developer.walmartlabs.com/docs?api_key=${this.apiKey}&itemId=${itemId}&format=json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Walmart API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Walmart product details failed:', error);
      throw error;
    }
  }

  /**
   * Extract price information from Walmart response
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
      const price = productDetails.salePrice || productDetails.price;
      if (!price) {
        return null;
      }

      const currentPrice = parseFloat(price);
      const originalPrice = productDetails.msrp ? parseFloat(productDetails.msrp) : undefined;
      const inStock = productDetails.availableOnline || false;
      const availabilityMessage = inStock ? 'Available online' : 'Out of stock';

      // Calculate savings if available
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (originalPrice && originalPrice > currentPrice) {
        discount = originalPrice - currentPrice;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract ratings
      const ratings = productDetails.customerRating ? {
        average: parseFloat(productDetails.customerRating),
        count: parseInt(productDetails.numReviews || '0'),
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
        ratings,
      };
    } catch (error) {
      this.logger.error('Failed to extract price info:', error);
      return null;
    }
  }

  /**
   * Check if Walmart API is configured
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
      this.logger.error('Walmart API availability check failed:', error);
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
      this.logger.error('Walmart API health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}