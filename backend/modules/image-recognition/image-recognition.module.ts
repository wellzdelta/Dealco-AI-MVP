import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageRecognitionService } from './image-recognition.service';
import { ImageRecognitionController } from './image-recognition.controller';
import { GoogleVisionService } from './services/google-vision.service';
import { RoboflowService } from './services/roboflow.service';
import { ImageProcessingService } from './services/image-processing.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheModule } from '../../common/cache/cache.module';
import { QueueModule } from '../../common/queue/queue.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
    forwardRef(() => QueueModule),
    SearchModule,
  ],
  providers: [
    ImageRecognitionService,
    GoogleVisionService,
    RoboflowService,
    ImageProcessingService,
  ],
  controllers: [ImageRecognitionController],
  exports: [ImageRecognitionService],
})
export class ImageRecognitionModule {}