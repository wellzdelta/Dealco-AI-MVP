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
import { Scan } from './scan.entity';

@Entity('products')
@Index(['name'])
@Index(['brand'])
@Index(['category'])
@Index(['sku'], { unique: true, where: '"sku" IS NOT NULL' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  upc: string;

  @Column({ nullable: true })
  ean: string;

  @Column({ nullable: true })
  isbn: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  subcategory: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  specifications: {
    dimensions: string;
    weight: string;
    color: string;
    material: string;
    size: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  images: {
    primary: string;
    secondary: string[];
    thumbnails: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  attributes: {
    gender: string;
    ageGroup: string;
    season: string;
    style: string;
    [key: string]: any;
  };

  @Column({ type: 'float', nullable: true })
  averagePrice: number;

  @Column({ type: 'float', nullable: true })
  lowestPrice: number;

  @Column({ type: 'float', nullable: true })
  highestPrice: number;

  @Column({ type: 'int', default: 0 })
  priceCount: number;

  @Column({ type: 'int', default: 0 })
  scanCount: number;

  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  @Column({ type: 'jsonb', nullable: true })
  embeddings: number[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    lastPriceUpdate: Date;
    lastScanAt: Date;
    source: string;
    verified: boolean;
  };

  @OneToMany(() => Price, price => price.product)
  prices: Price[];

  @OneToMany(() => Scan, scan => scan.product)
  scans: Scan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get displayName(): string {
    return this.brand ? `${this.brand} ${this.name}` : this.name;
  }

  get priceRange(): string {
    if (this.lowestPrice && this.highestPrice) {
      return `$${this.lowestPrice.toFixed(2)} - $${this.highestPrice.toFixed(2)}`;
    }
    return this.averagePrice ? `$${this.averagePrice.toFixed(2)}` : 'Price not available';
  }
}