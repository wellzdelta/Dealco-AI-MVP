import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

// Configuration
import { DatabaseConfig } from './config/database.config';
import { RedisConfig } from './config/redis.config';
import { ElasticsearchConfig } from './config/elasticsearch.config';

// Core modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { RetailersModule } from './modules/retailers/retailers.module';
import { ScansModule } from './modules/scans/scans.module';
import { PricesModule } from './modules/prices/prices.module';
import { ImageRecognitionModule } from './modules/image-recognition/image-recognition.module';
import { PriceEngineModule } from './modules/price-engine/price-engine.module';
import { AiNormalizationModule } from './modules/ai-normalization/ai-normalization.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { SearchModule } from './modules/search/search.module';

// Common modules
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './common/cache/cache.module';
import { QueueModule } from './common/queue/queue.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // Redis for caching
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: 0,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Elasticsearch
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useClass: ElasticsearchConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [{
          ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: configService.get<number>('RATE_LIMIT_LIMIT', 100),
        }],
      }),
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    CacheModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    RetailersModule,
    ScansModule,
    PricesModule,
    SearchModule,
    ImageRecognitionModule,
    PriceEngineModule,
    AiNormalizationModule,
    MonitoringModule,
  ],
})
export class AppModule {}