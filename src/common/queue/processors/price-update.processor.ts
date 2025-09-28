import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PriceUpdateJobData } from '../queue.service';
import { PriceEngineService } from '../../../modules/price-engine/price-engine.service';

@Processor('price-updates')
export class PriceUpdateProcessor {
  private readonly logger = new Logger(PriceUpdateProcessor.name);

  constructor(private readonly priceEngineService: PriceEngineService) {}

  @Process('update-price')
  async handlePriceUpdate(job: Job<PriceUpdateJobData>): Promise<void> {
    const { productId, retailerId } = job.data;
    
    this.logger.log(`Processing price update for product ${productId} at retailer ${retailerId}`);

    try {
      await this.priceEngineService.updateProductPrice(productId, retailerId);
      this.logger.log(`Successfully updated price for product ${productId} at retailer ${retailerId}`);
    } catch (error) {
      this.logger.error(`Failed to update price for product ${productId} at retailer ${retailerId}:`, error);
      throw error;
    }
  }
}