import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface PriceUpdateJobData {
  productId: string;
  retailerId: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ImageRecognitionJobData {
  scanId: string;
  imageUrl: string;
  imageHash: string;
  userId: string;
}

export interface ScrapingJobData {
  retailerId: string;
  productUrl: string;
  productId: string;
  retryCount?: number;
}

export interface NotificationJobData {
  userId: string;
  type: 'price_alert' | 'new_deal' | 'scan_complete';
  data: any;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('price-updates') private priceUpdateQueue: Queue,
    @InjectQueue('image-recognition') private imageRecognitionQueue: Queue,
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  /**
   * Add price update job
   */
  async addPriceUpdateJob(data: PriceUpdateJobData): Promise<void> {
    const priority = data.priority || 'medium';
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 5000 : 30000;

    await this.priceUpdateQueue.add('update-price', data, {
      priority: priority === 'high' ? 10 : priority === 'medium' ? 5 : 1,
      delay,
      jobId: `price-update-${data.productId}-${data.retailerId}`,
    });
  }

  /**
   * Add image recognition job
   */
  async addImageRecognitionJob(data: ImageRecognitionJobData): Promise<void> {
    await this.imageRecognitionQueue.add('recognize-image', data, {
      priority: 10,
      jobId: `image-recognition-${data.scanId}`,
    });
  }

  /**
   * Add scraping job
   */
  async addScrapingJob(data: ScrapingJobData): Promise<void> {
    await this.scrapingQueue.add('scrape-product', data, {
      priority: 5,
      delay: Math.random() * 10000, // Random delay to avoid rate limits
      jobId: `scraping-${data.retailerId}-${data.productId}`,
    });
  }

  /**
   * Add notification job
   */
  async addNotificationJob(data: NotificationJobData): Promise<void> {
    await this.notificationQueue.add('send-notification', data, {
      priority: 3,
      delay: 1000, // 1 second delay
      jobId: `notification-${data.userId}-${Date.now()}`,
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<any> {
    const [priceUpdateStats, imageRecognitionStats, scrapingStats, notificationStats] = await Promise.all([
      this.priceUpdateQueue.getJobCounts(),
      this.imageRecognitionQueue.getJobCounts(),
      this.scrapingQueue.getJobCounts(),
      this.notificationQueue.getJobCounts(),
    ]);

    return {
      priceUpdates: priceUpdateStats,
      imageRecognition: imageRecognitionStats,
      scraping: scrapingStats,
      notifications: notificationStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean completed jobs
   */
  async cleanCompletedJobs(): Promise<void> {
    await Promise.all([
      this.priceUpdateQueue.clean(24 * 60 * 60 * 1000, 'completed'), // 24 hours
      this.imageRecognitionQueue.clean(12 * 60 * 60 * 1000, 'completed'), // 12 hours
      this.scrapingQueue.clean(48 * 60 * 60 * 1000, 'completed'), // 48 hours
      this.notificationQueue.clean(6 * 60 * 60 * 1000, 'completed'), // 6 hours
    ]);
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.pause();
    }
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    if (queue) {
      await queue.resume();
    }
  }

  /**
   * Get queue by name
   */
  private getQueueByName(queueName: string): Queue | null {
    switch (queueName) {
      case 'price-updates':
        return this.priceUpdateQueue;
      case 'image-recognition':
        return this.imageRecognitionQueue;
      case 'scraping':
        return this.scrapingQueue;
      case 'notifications':
        return this.notificationQueue;
      default:
        return null;
    }
  }
}