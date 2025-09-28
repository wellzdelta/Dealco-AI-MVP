import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Scan } from './scan.entity';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  verificationToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    currency: string;
    country: string;
    language: string;
    notifications: {
      priceAlerts: boolean;
      newDeals: boolean;
      weeklyDigest: boolean;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    lastLoginAt: Date;
    loginCount: number;
    deviceInfo: any;
    ipAddress: string;
  };

  @OneToMany(() => Scan, scan => scan.user)
  scans: Scan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }
}