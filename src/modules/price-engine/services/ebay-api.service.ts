import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceEngineService } from '../interfaces/price-engine.interface';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class EbayApiService implements PriceEngineService {
  private readonly logger = new Logger(EbayApiService.name);
  private readonly appId: string;
  private readonly baseUrl = 'https://api.ebay.com/buy/browse/v1';

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('EBAY_APP_ID');
  }

  /**
   * Get product price from eBay API
   */
  async getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('eBay API not configured');
        return null;
      }

      this.logger.log(`Fetching price from eBay for product: ${product.name}`);

      // Search for product using eBay API
      const searchResponse = await this.searchProduct(product);
      if (!searchResponse || !searchResponse.itemSummaries || searchResponse.itemSummaries.length === 0) {
        return null;
      }

      const item = searchResponse.itemSummaries[0];
      if (!item) {
        return null;
      }

      // Get detailed product information
      const productResponse = await this.getProductDetails(item.itemId);
      if (!productResponse) {
        return null;
      }

      const productDetails = productResponse;
      
      // Extract price information
      const priceInfo = this.extractPriceInfo(productDetails);
      if (!priceInfo) {
        return null;
      }

      const result: PriceResult = {
        productId: product.id,
        retailerId: retailer.id,
        price: priceInfo.price,
        currency: priceInfo.currency,
        originalPrice: priceInfo.originalPrice,
        discount: priceInfo.discount,
        discountPercentage: priceInfo.discountPercentage,
        productUrl: productDetails.itemWebUrl,
        imageUrl: productDetails.image?.imageUrl,
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
          confidence: 0.85,
          lastVerified: new Date(),
          dataQuality: 'medium',
        },
      };

      this.logger.log(`Successfully fetched eBay price: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch eBay price:', error);
      return null;
    }
  }

  /**
   * Search for product using eBay API
   */
  private async searchProduct(product: Product): Promise<any> {
    try {
      const searchQuery = `${product.brand} ${product.name}`.trim();
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const url = `${this.baseUrl}/item_summary/search?q=${encodedQuery}&limit=1&filter=deliveryCountry:US`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.appId}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('eBay search failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed product information
   */
  private async getProductDetails(itemId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/item/${itemId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.appId}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('eBay product details failed:', error);
      throw error;
    }
  }

  /**
   * Extract price information from eBay response
   */
  private extractPriceInfo(productDetails: any): {
    price: number;
    currency: string;
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
      const currency = productDetails.price?.currency || 'USD';
      
      if (!price) {
        return null;
      }

      const currentPrice = parseFloat(price);
      const inStock = productDetails.buyingOptions?.includes('FIXED_PRICE') || false;
      const availabilityMessage = inStock ? 'Available for purchase' : 'Not available';

      // Extract shipping cost
      const shippingCost = productDetails.shippingOptions?.find((option: any) => 
        option.shippingCostType === 'FIXED'
      )?.shippingCost?.value;

      // Extract estimated delivery
      const estimatedDelivery = productDetails.shippingOptions?.find((option: any) => 
        option.shippingCostType === 'FIXED'
      )?.estimatedDeliveryDate;

      return {
        price: currentPrice,
        currency,
        inStock,
        stockQuantity: 1, // eBay items are typically single quantity
        shippingCost: shippingCost ? parseFloat(shippingCost) : undefined,
        estimatedDelivery,
        availabilityMessage,
      };
    } catch (error) {
      this.logger.error('Failed to extract price info:', error);
      return null;
    }
  }

  /**
   * Check if eBay API is configured
   */
  private isConfigured(): boolean {
    return !!this.appId;
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
      this.logger.error('eBay API availability check failed:', error);
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
      this.logger.error('eBay API health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}