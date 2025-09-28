import { Product } from '../../../database/entities/product.entity';
import { Retailer } from '../../../database/entities/retailer.entity';
import { PriceResult } from '../price-engine.service';

export interface PriceEngineService {
  /**
   * Get product price from this service
   */
  getProductPrice(product: Product, retailer: Retailer): Promise<PriceResult | null>;

  /**
   * Check if service is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get service health status
   */
  getHealthStatus(): Promise<{ status: string; lastCheck: Date }>;
}