import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('price_history')
@Index(['productId', 'retailerId', 'createdAt'])
@Index(['price'])
@Index(['createdAt'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  retailerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  originalPrice: number;

  @Column({ default: true })
  inStock: boolean;

  @Column({ nullable: true })
  stockQuantity: number;

  @Column({ nullable: true })
  shippingCost: number;

  @Column({ type: 'jsonb', nullable: true })
  promotions: {
    type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping';
    value: number;
    description: string;
    validUntil: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source: 'api' | 'scraper' | 'manual';
    confidence: number;
    dataQuality: 'high' | 'medium' | 'low';
  };

  @CreateDateColumn()
  createdAt: Date;
}