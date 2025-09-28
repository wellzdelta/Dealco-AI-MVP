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
import { User } from './user.entity';
import { Product } from './product.entity';

@Entity('scans')
@Index(['userId'])
@Index(['productId'])
@Index(['createdAt'])
@Index(['confidenceScore'])
export class Scan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  imageMetadata: {
    width: number;
    height: number;
    size: number;
    format: string;
    uploadedAt: Date;
  };

  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  @Column({ type: 'jsonb', nullable: true })
  recognitionResults: {
    provider: 'google_vision' | 'roboflow' | 'manual';
    productName: string;
    brand: string;
    category: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    rawResponse: any;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  aiNormalization: {
    normalizedName: string;
    normalizedBrand: string;
    normalizedCategory: string;
    extractedAttributes: {
      color: string;
      size: string;
      material: string;
      [key: string]: any;
    };
    confidence: number;
    provider: 'claude' | 'openai';
  };

  @Column({ type: 'jsonb', nullable: true })
  searchResults: {
    totalFound: number;
    exactMatches: number;
    similarMatches: number;
    searchTime: number;
    searchQuery: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  priceResults: {
    totalPrices: number;
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    retailers: string[];
    lastUpdated: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  userFeedback: {
    isCorrect: boolean;
    correctProductId: string;
    feedback: string;
    submittedAt: Date;
  };

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column({ type: 'jsonb', nullable: true })
  error: {
    code: string;
    message: string;
    stack: string;
    timestamp: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    userAgent: string;
    ipAddress: string;
    deviceInfo: any;
    processingTime: number;
    apiCalls: number;
    scraperCalls: number;
  };

  @ManyToOne(() => User, user => user.scans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, product => product.scans, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get isSuccessful(): boolean {
    return this.status === 'completed' && this.productId !== null;
  }

  get hasFeedback(): boolean {
    return this.userFeedback !== null;
  }

  get processingDuration(): number {
    if (this.metadata?.processingTime) {
      return this.metadata.processingTime;
    }
    return this.updatedAt.getTime() - this.createdAt.getTime();
  }

  get bestMatch(): any {
    if (!this.recognitionResults || this.recognitionResults.length === 0) {
      return null;
    }
    return this.recognitionResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
}