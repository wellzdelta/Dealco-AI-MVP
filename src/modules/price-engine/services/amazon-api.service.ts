import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PriceEngineService } from '../interfaces/price-engine.interface';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class AmazonApiService implements PriceEngineService {
  private readonly logger = new Logger(AmazonApiService.name);
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly associateTag: string;
  private readonly baseUrl = 'https://webservices.amazon.com/paapi5/searchitems';

  constructor(private readonly configService: ConfigService) {
    this.accessKey = this.configService.get<string>('AMAZON_ACCESS_KEY');
    this.secretKey = this.configService.get<string>('AMAZON_SECRET_KEY');
    this.associateTag = this.configService.get<string>('AMAZON_ASSOCIATE_TAG');
  }

  /**
   * Get product price from Amazon API
   */
  async getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('Amazon API not configured');
        return null;
      }

      this.logger.log(`Fetching price from Amazon for product: ${product.name}`);

      // Search for product using Amazon Product Advertising API
      const searchResponse = await this.searchProduct(product);
      if (!searchResponse || !searchResponse.SearchResult || !searchResponse.SearchResult.Items) {
        return null;
      }

      const item = searchResponse.SearchResult.Items[0];
      if (!item) {
        return null;
      }

      // Get detailed product information
      const productResponse = await this.getProductDetails(item.ASIN);
      if (!productResponse || !productResponse.Items) {
        return null;
      }

      const productDetails = productResponse.Items[0];
      if (!productDetails) {
        return null;
      }

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
        productUrl: productDetails.DetailPageURL,
        imageUrl: productDetails.Images?.Primary?.Large?.URL,
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
          confidence: 0.95,
          lastVerified: new Date(),
          dataQuality: 'high',
        },
      };

      this.logger.log(`Successfully fetched Amazon price: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch Amazon price:', error);
      return null;
    }
  }

  /**
   * Search for product using Amazon API
   */
  private async searchProduct(product: Product): Promise<any> {
    try {
      const searchQuery = `${product.brand} ${product.name}`.trim();
      
      const requestBody = {
        PartnerTag: this.associateTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com',
        SearchIndex: 'All',
        Keywords: searchQuery,
        ItemCount: 1,
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Classifications',
          'ItemInfo.ContentInfo',
          'ItemInfo.ExternalIds',
          'ItemInfo.Features',
          'ItemInfo.ManufactureInfo',
          'ItemInfo.ProductInfo',
          'ItemInfo.TechnicalInfo',
          'ItemInfo.TradeInInfo',
          'Offers.Listings.Availability',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo',
          'Offers.Listings.LoyaltyPoints',
          'Offers.Listings.MerchantInfo',
          'Offers.Listings.Price',
          'Offers.Listings.ProgramEligibility',
          'Offers.Listings.Promotions',
          'Offers.Listings.SavingBasis',
          'Offers.Summaries.HighestPrice',
          'Offers.Summaries.LowestPrice',
          'Offers.Summaries.OfferCount',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
        ],
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Amazon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Amazon search failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed product information
   */
  private async getProductDetails(asin: string): Promise<any> {
    try {
      const requestBody = {
        PartnerTag: this.associateTag,
        PartnerType: 'Associates',
        Marketplace: 'www.amazon.com',
        ItemIds: [asin],
        Resources: [
          'Images.Primary.Large',
          'ItemInfo.Title',
          'ItemInfo.ByLineInfo',
          'ItemInfo.Classifications',
          'ItemInfo.ContentInfo',
          'ItemInfo.ExternalIds',
          'ItemInfo.Features',
          'ItemInfo.ManufactureInfo',
          'ItemInfo.ProductInfo',
          'ItemInfo.TechnicalInfo',
          'ItemInfo.TradeInInfo',
          'Offers.Listings.Availability',
          'Offers.Listings.Condition',
          'Offers.Listings.DeliveryInfo',
          'Offers.Listings.LoyaltyPoints',
          'Offers.Listings.MerchantInfo',
          'Offers.Listings.Price',
          'Offers.Listings.ProgramEligibility',
          'Offers.Listings.Promotions',
          'Offers.Listings.SavingBasis',
          'Offers.Summaries.HighestPrice',
          'Offers.Summaries.LowestPrice',
          'Offers.Summaries.OfferCount',
          'CustomerReviews.Count',
          'CustomerReviews.StarRating',
        ],
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Amazon API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Amazon product details failed:', error);
      throw error;
    }
  }

  /**
   * Extract price information from Amazon response
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
      const offers = productDetails.Offers?.Listings;
      if (!offers || offers.length === 0) {
        return null;
      }

      const offer = offers[0];
      const price = offer.Price;
      const availability = offer.Availability;

      if (!price || !availability) {
        return null;
      }

      const currentPrice = parseFloat(price.Amount);
      const currency = price.Currency || 'USD';
      const inStock = availability.Type === 'Now';
      const availabilityMessage = availability.Message || '';

      // Calculate savings if available
      let originalPrice: number | undefined;
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (offer.SavingBasis) {
        originalPrice = parseFloat(offer.SavingBasis.Amount);
        discount = originalPrice - currentPrice;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract promotions
      const promotions = offer.Promotions?.map((promo: any) => ({
        type: promo.Type,
        value: promo.Value,
        description: promo.Description,
        validUntil: new Date(promo.EndDate),
      }));

      // Extract ratings
      const ratings = productDetails.CustomerReviews;
      const ratingsData = ratings ? {
        average: parseFloat(ratings.StarRating?.Value || '0'),
        count: parseInt(ratings.Count || '0'),
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
        currency,
        originalPrice,
        discount,
        discountPercentage,
        inStock,
        availabilityMessage,
        promotions,
        ratings: ratingsData,
      };
    } catch (error) {
      this.logger.error('Failed to extract price info:', error);
      return null;
    }
  }

  /**
   * Check if Amazon API is configured
   */
  private isConfigured(): boolean {
    return !!(this.accessKey && this.secretKey && this.associateTag);
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
      this.logger.error('Amazon API availability check failed:', error);
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
      this.logger.error('Amazon API health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}