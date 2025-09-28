import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private readonly apiToken: string;
  private readonly baseUrl = 'https://api.apify.com/v2';

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('APIFY_API_TOKEN');
  }

  /**
   * Scrape product using Apify
   */
  async scrapeProduct(productUrl: string, retailer: Retailer): Promise<PriceResult | null> {
    try {
      if (!this.isConfigured()) {
        this.logger.warn('Apify API not configured');
        return null;
      }

      this.logger.log(`Scraping product using Apify: ${productUrl}`);

      // Determine the appropriate Apify actor based on retailer
      const actorId = this.getActorIdForRetailer(retailer);
      if (!actorId) {
        return null;
      }

      // Run the Apify actor
      const runResult = await this.runApifyActor(actorId, productUrl);
      if (!runResult) {
        return null;
      }

      // Extract price information from Apify result
      const priceInfo = this.extractPriceFromApifyResult(runResult, retailer);
      if (!priceInfo) {
        return null;
      }

      const result: PriceResult = {
        productId: '', // Will be set by caller
        retailerId: retailer.id,
        price: priceInfo.price,
        currency: priceInfo.currency,
        originalPrice: priceInfo.originalPrice,
        discount: priceInfo.discount,
        discountPercentage: priceInfo.discountPercentage,
        productUrl,
        imageUrl: priceInfo.imageUrl,
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
          source: 'scraper',
          confidence: 0.80,
          lastVerified: new Date(),
          dataQuality: 'high',
        },
      };

      this.logger.log(`Successfully scraped using Apify: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to scrape product using Apify:', error);
      return null;
    }
  }

  /**
   * Get Apify actor ID for retailer
   */
  private getActorIdForRetailer(retailer: Retailer): string | null {
    const actorMap: { [key: string]: string } = {
      'amazon': 'apify/web-scraper',
      'walmart': 'apify/web-scraper',
      'ebay': 'apify/web-scraper',
      'bestbuy': 'apify/web-scraper',
      'zalando': 'apify/web-scraper',
      'farfetch': 'apify/web-scraper',
    };

    return actorMap[retailer.name.toLowerCase()] || null;
  }

  /**
   * Run Apify actor
   */
  private async runApifyActor(actorId: string, productUrl: string): Promise<any> {
    try {
      // Start the actor run
      const runResponse = await fetch(`${this.baseUrl}/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startUrls: [{ url: productUrl }],
          maxRequestsPerCrawl: 1,
          maxConcurrency: 1,
        }),
      });

      if (!runResponse.ok) {
        throw new Error(`Apify API error: ${runResponse.status} ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Wait for the run to complete
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes max wait time

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

        const statusResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`Apify status check failed: ${statusResponse.status}`);
        }

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
          // Get the results
          const resultsResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}/dataset/items`, {
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
            },
          });

          if (!resultsResponse.ok) {
            throw new Error(`Apify results fetch failed: ${resultsResponse.status}`);
          }

          const results = await resultsResponse.json();
          return results[0]; // Return first result
        } else if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`Apify run failed with status: ${status}`);
        }

        attempts++;
      }

      throw new Error('Apify run timed out');
    } catch (error) {
      this.logger.error('Failed to run Apify actor:', error);
      throw error;
    }
  }

  /**
   * Extract price information from Apify result
   */
  private extractPriceFromApifyResult(apifyResult: any, retailer: Retailer): {
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
    imageUrl?: string;
    promotions?: any[];
    ratings?: any;
  } | null {
    try {
      // Extract price from Apify result
      const price = apifyResult.price || apifyResult.currentPrice || apifyResult.salePrice;
      if (!price) {
        return null;
      }

      const currentPrice = parseFloat(price.toString().replace(/[^0-9.]/g, ''));
      const currency = retailer.currency || 'USD';
      const inStock = this.determineStockStatusFromApify(apifyResult);
      const availabilityMessage = apifyResult.availability || apifyResult.stockStatus || '';

      // Extract original price if available
      const originalPrice = apifyResult.originalPrice || apifyResult.regularPrice;
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (originalPrice && originalPrice > currentPrice) {
        discount = originalPrice - currentPrice;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract image URL
      const imageUrl = apifyResult.image || apifyResult.imageUrl || apifyResult.thumbnail;

      // Extract shipping cost
      const shippingCost = apifyResult.shippingCost || apifyResult.shipping;

      // Extract estimated delivery
      const estimatedDelivery = apifyResult.estimatedDelivery || apifyResult.deliveryTime;

      // Extract ratings
      const ratings = apifyResult.rating ? {
        average: parseFloat(apifyResult.rating.average || apifyResult.rating),
        count: parseInt(apifyResult.rating.count || apifyResult.reviewCount || '0'),
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
        originalPrice: originalPrice ? parseFloat(originalPrice.toString().replace(/[^0-9.]/g, '')) : undefined,
        discount,
        discountPercentage,
        inStock,
        availabilityMessage,
        imageUrl,
        shippingCost: shippingCost ? parseFloat(shippingCost.toString().replace(/[^0-9.]/g, '')) : undefined,
        estimatedDelivery,
        ratings,
      };
    } catch (error) {
      this.logger.error('Failed to extract price from Apify result:', error);
      return null;
    }
  }

  /**
   * Determine stock status from Apify result
   */
  private determineStockStatusFromApify(apifyResult: any): boolean {
    const availability = apifyResult.availability || apifyResult.stockStatus || apifyResult.inStock;
    
    if (typeof availability === 'boolean') {
      return availability;
    }

    if (typeof availability === 'string') {
      const lowerText = availability.toLowerCase();
      const inStockKeywords = ['in stock', 'available', 'add to cart', 'buy now'];
      const outOfStockKeywords = ['out of stock', 'unavailable', 'sold out', 'coming soon'];

      for (const keyword of outOfStockKeywords) {
        if (lowerText.includes(keyword)) {
          return false;
        }
      }

      for (const keyword of inStockKeywords) {
        if (lowerText.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if Apify is configured
   */
  private isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * Get Apify service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      if (!this.isConfigured()) {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
        };
      }

      // Test with a simple API call
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Apify health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}