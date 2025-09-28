import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PriceUpdateProcessor } from './processors/price-update.processor';
import { ImageRecognitionProcessor } from './processors/image-recognition.processor';
import { ScrapingProcessor } from './processors/scraping.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'price-updates',
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      },
      {
        name: 'image-recognition',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
      {
        name: 'scraping',
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      },
      {
        name: 'notifications',
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      },
    ),
  ],
  providers: [
    PriceUpdateProcessor,
    ImageRecognitionProcessor,
    ScrapingProcessor,
    NotificationProcessor,
    QueueService,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}