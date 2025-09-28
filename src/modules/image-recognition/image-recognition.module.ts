import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageRecognitionService } from './image-recognition.service';
import { ImageRecognitionController } from './image-recognition.controller';
import { GoogleVisionService } from './services/google-vision.service';
import { RoboflowService } from './services/roboflow.service';
import { ImageProcessingService } from './services/image-processing.service';

@Module({
  imports: [ConfigModule],
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