import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { QueueModule } from '../../common/queue/queue.module';
import { ImageRecognitionModule } from '../image-recognition/image-recognition.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';
import { AiNormalizationModule } from '../ai-normalization/ai-normalization.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    ImageRecognitionModule,
    PriceEngineModule,
    AiNormalizationModule,
  ],
  providers: [MonitoringService],
  controllers: [MonitoringController],
  exports: [MonitoringService],
})
export class MonitoringModule {}