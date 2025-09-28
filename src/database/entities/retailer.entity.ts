import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Price } from './price.entity';

@Entity('retailers')
@Index(['name'])
@Index(['domain'])
@Index(['country'])
export class Retailer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  domain: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  apiConfig: {
    hasApi: boolean;
    apiEndpoint: string;
    apiKey: string;
    rateLimit: number;
    lastUsed: Date;
    status: 'active' | 'inactive' | 'error';
  };

  @Column({ type: 'jsonb', nullable: true })
  scraperConfig: {
    enabled: boolean;
    selectors: {
      productName: string;
      price: string;
      availability: string;
      image: string;
    };
    lastScraped: Date;
    successRate: number;
    averageResponseTime: number;
  };

  @Column({ type: 'float', default: 1.0 })
  trustScore: number;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  shipping: {
    freeShippingThreshold: number;
    averageShippingTime: number;
    shippingCost: number;
    internationalShipping: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  returnPolicy: {
    returnWindow: number;
    returnCost: number;
    refundMethod: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    lastPriceUpdate: Date;
    lastHealthCheck: Date;
    errorCount: number;
    successCount: number;
    averageResponseTime: number;
  };

  @OneToMany(() => Price, price => price.retailer)
  prices: Price[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get isApiEnabled(): boolean {
    return this.apiConfig?.hasApi && this.apiConfig?.status === 'active';
  }

  get isScraperEnabled(): boolean {
    return this.scraperConfig?.enabled;
  }

  get healthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (!this.metadata) return 'unhealthy';
    
    const errorRate = this.metadata.errorCount / (this.metadata.errorCount + this.metadata.successCount);
    
    if (errorRate < 0.1) return 'healthy';
    if (errorRate < 0.3) return 'degraded';
    return 'unhealthy';
  }
}