import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScrapingJobData } from '../queue.service';
import { PriceEngineService } from '../../../modules/price-engine/price-engine.service';

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly priceEngineService: PriceEngineService) {}

  @Process('scrape-product')
  async handleScraping(job: Job<ScrapingJobData>): Promise<void> {
    const { retailerId, productUrl, productId, retryCount = 0 } = job.data;
    
    this.logger.log(`Processing scraping for product ${productId} at retailer ${retailerId}`);

    try {
      await this.priceEngineService.scrapeProductPrice(retailerId, productUrl, productId);
      this.logger.log(`Successfully scraped price for product ${productId} at retailer ${retailerId}`);
    } catch (error) {
      this.logger.error(`Failed to scrape price for product ${productId} at retailer ${retailerId}:`, error);
      
      // Retry logic
      if (retryCount < 3) {
        this.logger.log(`Retrying scraping for product ${productId} at retailer ${retailerId} (attempt ${retryCount + 1})`);
        throw error; // Let Bull handle the retry
      } else {
        this.logger.error(`Max retries reached for scraping product ${productId} at retailer ${retailerId}`);
        throw error;
      }
    }
  }
}