import { Module } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { QueueModule } from '../../common/queue/queue.module';
import { ImageRecognitionModule } from '../image-recognition/image-recognition.module';
import { PriceEngineModule } from '../price-engine/price-engine.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    ImageRecognitionModule,
    PriceEngineModule,
  ],
  providers: [ScansService],
  controllers: [ScansController],
  exports: [ScansService],
})
export class ScansModule {}