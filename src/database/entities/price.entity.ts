import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { Retailer } from './retailer.entity';

@Entity('prices')
@Index(['productId', 'retailerId'], { unique: true })
@Index(['price'])
@Index(['currency'])
@Index(['updatedAt'])
export class Price {
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

  @Column({ nullable: true })
  discount: number;

  @Column({ nullable: true })
  discountPercentage: number;

  @Column({ type: 'text', nullable: true })
  productUrl: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ default: true })
  inStock: boolean;

  @Column({ nullable: true })
  stockQuantity: number;

  @Column({ nullable: true })
  shippingCost: number;

  @Column({ nullable: true })
  estimatedDelivery: string;

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    status: 'in_stock' | 'out_of_stock' | 'limited' | 'pre_order';
    message: string;
    lastChecked: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  promotions: {
    type: 'percentage' | 'fixed' | 'bogo' | 'free_shipping';
    value: number;
    description: string;
    validUntil: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  ratings: {
    average: number;
    count: number;
    distribution: {
      five: number;
      four: number;
      three: number;
      two: number;
      one: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source: 'api' | 'scraper' | 'manual';
    confidence: number;
    lastVerified: Date;
    dataQuality: 'high' | 'medium' | 'low';
  };

  @ManyToOne(() => Product, product => product.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Retailer, retailer => retailer.prices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'retailerId' })
  retailer: Retailer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get isOnSale(): boolean {
    return this.originalPrice && this.originalPrice > this.price;
  }

  get totalCost(): number {
    return this.price + (this.shippingCost || 0);
  }

  get savings(): number {
    if (this.originalPrice && this.originalPrice > this.price) {
      return this.originalPrice - this.price;
    }
    return 0;
  }

  get savingsPercentage(): number {
    if (this.originalPrice && this.originalPrice > this.price) {
      return ((this.originalPrice - this.price) / this.originalPrice) * 100;
    }
    return 0;
  }
}