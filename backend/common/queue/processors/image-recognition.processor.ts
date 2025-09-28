import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ImageRecognitionJobData } from '../queue.service';
import { ImageRecognitionService } from '../../../modules/image-recognition/image-recognition.service';

@Processor('image-recognition')
export class ImageRecognitionProcessor {
  private readonly logger = new Logger(ImageRecognitionProcessor.name);

  constructor(private readonly imageRecognitionService: ImageRecognitionService) {}

  @Process('recognize-image')
  async handleImageRecognition(job: Job<ImageRecognitionJobData>): Promise<void> {
    const { scanId, imageUrl, imageHash, userId } = job.data;
    
    this.logger.log(`Processing image recognition for scan ${scanId}`);

    try {
      await this.imageRecognitionService.processImageRecognition(scanId, imageUrl, imageHash, userId);
      this.logger.log(`Successfully processed image recognition for scan ${scanId}`);
    } catch (error) {
      this.logger.error(`Failed to process image recognition for scan ${scanId}:`, error);
      throw error;
    }
  }
}