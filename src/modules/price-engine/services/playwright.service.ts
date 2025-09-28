import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

@Injectable()
export class PlaywrightService {
  private readonly logger = new Logger(PlaywrightService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Scrape product using Playwright
   */
  async scrapeProduct(productUrl: string, retailer: Retailer): Promise<PriceResult | null> {
    try {
      this.logger.log(`Scraping product using Playwright: ${productUrl}`);

      // Import Playwright dynamically to avoid issues if not installed
      const { chromium } = await import('playwright');
      
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to the product page
        await page.goto(productUrl, { waitUntil: 'networkidle' });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract product information
        const productData = await this.extractProductData(page, retailer);
        
        if (!productData) {
          return null;
        }

        const result: PriceResult = {
          productId: '', // Will be set by caller
          retailerId: retailer.id,
          price: productData.price,
          currency: productData.currency,
          originalPrice: productData.originalPrice,
          discount: productData.discount,
          discountPercentage: productData.discountPercentage,
          productUrl,
          imageUrl: productData.imageUrl,
          inStock: productData.inStock,
          stockQuantity: productData.stockQuantity,
          shippingCost: productData.shippingCost,
          estimatedDelivery: productData.estimatedDelivery,
          availability: {
            status: productData.inStock ? 'in_stock' : 'out_of_stock',
            message: productData.availabilityMessage,
            lastChecked: new Date(),
          },
          promotions: productData.promotions,
          ratings: productData.ratings,
          metadata: {
            source: 'scraper',
            confidence: 0.85,
            lastVerified: new Date(),
            dataQuality: 'high',
          },
        };

        this.logger.log(`Successfully scraped using Playwright: $${productData.price}`);
        return result;
      } finally {
        await browser.close();
      }
    } catch (error) {
      this.logger.error('Failed to scrape product using Playwright:', error);
      return null;
    }
  }

  /**
   * Extract product data from page
   */
  private async extractProductData(page: any, retailer: Retailer): Promise<{
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
  } | null> {
    try {
      const selectors = retailer.scraperConfig?.selectors;
      if (!selectors) {
        return null;
      }

      // Extract price
      const priceElement = await page.$(selectors.price);
      const priceText = priceElement ? await priceElement.textContent() : '';
      const price = this.extractPriceFromText(priceText);

      if (!price) {
        return null;
      }

      // Extract product name
      const nameElement = await page.$(selectors.productName);
      const productName = nameElement ? await nameElement.textContent() : '';

      // Extract availability
      const availabilityElement = await page.$(selectors.availability);
      const availabilityText = availabilityElement ? await availabilityElement.textContent() : '';
      const inStock = this.determineStockStatus(availabilityText);

      // Extract image
      const imageElement = await page.$(selectors.image);
      const imageUrl = imageElement ? await imageElement.getAttribute('src') : '';

      // Extract original price if available
      let originalPrice: number | undefined;
      try {
        const originalPriceElement = await page.$('[data-testid="original-price"], .original-price, .was-price, .list-price');
        if (originalPriceElement) {
          const originalPriceText = await originalPriceElement.textContent();
          originalPrice = this.extractPriceFromText(originalPriceText);
        }
      } catch (error) {
        // Original price not found, that's okay
      }

      // Calculate discount if original price is available
      let discount: number | undefined;
      let discountPercentage: number | undefined;

      if (originalPrice && originalPrice > price) {
        discount = originalPrice - price;
        discountPercentage = (discount / originalPrice) * 100;
      }

      // Extract shipping cost
      let shippingCost: number | undefined;
      try {
        const shippingElement = await page.$('[data-testid="shipping-cost"], .shipping-cost, .delivery-cost');
        if (shippingElement) {
          const shippingText = await shippingElement.textContent();
          shippingCost = this.extractPriceFromText(shippingText);
        }
      } catch (error) {
        // Shipping cost not found, that's okay
      }

      // Extract ratings
      let ratings: any;
      try {
        const ratingElement = await page.$('[data-testid="rating"], .rating, .stars');
        if (ratingElement) {
          const ratingText = await ratingElement.textContent();
          const ratingValue = parseFloat(ratingText?.replace(/[^0-9.]/g, '') || '0');
          
          if (ratingValue > 0) {
            ratings = {
              average: ratingValue,
              count: 0, // Would need to extract review count separately
              distribution: {
                five: 0,
                four: 0,
                three: 0,
                two: 0,
                one: 0,
              },
            };
          }
        }
      } catch (error) {
        // Ratings not found, that's okay
      }

      return {
        price,
        currency: retailer.currency || 'USD',
        originalPrice,
        discount,
        discountPercentage,
        inStock,
        availabilityMessage: availabilityText || '',
        imageUrl,
        shippingCost,
        ratings,
      };
    } catch (error) {
      this.logger.error('Failed to extract product data:', error);
      return null;
    }
  }

  /**
   * Extract price from text
   */
  private extractPriceFromText(text: string): number | null {
    if (!text) {
      return null;
    }

    // Remove currency symbols and extract numeric value
    const priceMatch = text.match(/[\d,]+\.?\d*/);
    if (priceMatch) {
      return parseFloat(priceMatch[0].replace(/,/g, ''));
    }

    return null;
  }

  /**
   * Determine stock status from text
   */
  private determineStockStatus(text: string): boolean {
    if (!text) {
      return false;
    }

    const lowerText = text.toLowerCase();
    const inStockKeywords = ['in stock', 'available', 'add to cart', 'buy now', 'purchase'];
    const outOfStockKeywords = ['out of stock', 'unavailable', 'sold out', 'coming soon', 'discontinued'];

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
   * Get Playwright service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      // Test with a simple page load
      const { chromium } = await import('playwright');
      
      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.goto('https://httpbin.org/html', { waitUntil: 'networkidle' });
        await browser.close();
        
        return {
          status: 'healthy',
          lastCheck: new Date(),
        };
      } catch (error) {
        await browser.close();
        throw error;
      }
    } catch (error) {
      this.logger.error('Playwright health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}