import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Scrape product price from retailer website
   */
  async scrapeProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null> {
    try {
      this.logger.log(`Scraping price from ${retailer.name} for product: ${product.name}`);

      // Build product URL
      const productUrl = this.buildProductUrl(product, retailer);
      if (!productUrl) {
        return null;
      }

      // Scrape the product page
      const scrapedData = await this.scrapeProductPage(productUrl, retailer);
      if (!scrapedData) {
        return null;
      }

      // Extract price information
      const priceInfo = this.extractPriceFromScrapedData(scrapedData, retailer);
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
          confidence: 0.75,
          lastVerified: new Date(),
          dataQuality: 'medium',
        },
      };

      this.logger.log(`Successfully scraped ${retailer.name} price: $${priceInfo.price}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to scrape price from ${retailer.name}:`, error);
      return null;
    }
  }

  /**
   * Build product URL for retailer
   */
  private buildProductUrl(product: Product, retailer: Retailer): string | null {
    try {
      const baseUrl = retailer.domain;
      if (!baseUrl) {
        return null;
      }

      // Simple URL building - in production, you'd have more sophisticated logic
      const searchQuery = encodeURIComponent(`${product.brand} ${product.name}`);
      return `https://${baseUrl}/search?q=${searchQuery}`;
    } catch (error) {
      this.logger.error('Failed to build product URL:', error);
      return null;
    }
  }

  /**
   * Scrape product page
   */
  private async scrapeProductPage(url: string, retailer: Retailer): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtml(html, retailer);
    } catch (error) {
      this.logger.error('Failed to scrape product page:', error);
      return null;
    }
  }

  /**
   * Parse HTML content
   */
  private parseHtml(html: string, retailer: Retailer): any {
    try {
      // This is a simplified parser - in production, you'd use a proper HTML parser
      const selectors = retailer.scraperConfig?.selectors;
      if (!selectors) {
        return null;
      }

      // Extract product name
      const productNameMatch = html.match(new RegExp(selectors.productName, 'i'));
      const productName = productNameMatch ? productNameMatch[1] : '';

      // Extract price
      const priceMatch = html.match(new RegExp(selectors.price, 'i'));
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/[^0-9.]/g, '')) : null;

      // Extract availability
      const availabilityMatch = html.match(new RegExp(selectors.availability, 'i'));
      const availability = availabilityMatch ? availabilityMatch[1] : '';

      // Extract image
      const imageMatch = html.match(new RegExp(selectors.image, 'i'));
      const imageUrl = imageMatch ? imageMatch[1] : '';

      return {
        productName,
        price,
        availability,
        imageUrl,
        rawHtml: html,
      };
    } catch (error) {
      this.logger.error('Failed to parse HTML:', error);
      return null;
    }
  }

  /**
   * Extract price information from scraped data
   */
  private extractPriceFromScrapedData(scrapedData: any, retailer: Retailer): {
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
      if (!scrapedData.price) {
        return null;
      }

      const currentPrice = scrapedData.price;
      const currency = retailer.currency || 'USD';
      const inStock = this.determineStockStatus(scrapedData.availability);
      const availabilityMessage = scrapedData.availability || '';

      return {
        price: currentPrice,
        currency,
        inStock,
        availabilityMessage,
        imageUrl: scrapedData.imageUrl,
      };
    } catch (error) {
      this.logger.error('Failed to extract price from scraped data:', error);
      return null;
    }
  }

  /**
   * Determine stock status from availability text
   */
  private determineStockStatus(availabilityText: string): boolean {
    if (!availabilityText) {
      return false;
    }

    const inStockKeywords = ['in stock', 'available', 'add to cart', 'buy now'];
    const outOfStockKeywords = ['out of stock', 'unavailable', 'sold out', 'coming soon'];

    const lowerText = availabilityText.toLowerCase();

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

    return false;
  }

  /**
   * Get scraping service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      // Test with a simple request
      const testUrl = 'https://httpbin.org/html';
      const response = await fetch(testUrl);
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Scraping service health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}