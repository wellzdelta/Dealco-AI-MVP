import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecognitionResult } from '../image-recognition.service';

@Injectable()
export class RoboflowService {
  private readonly logger = new Logger(RoboflowService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://detect.roboflow.com';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ROBOFLOW_API_KEY');
  }

  /**
   * Recognize product in image using Roboflow
   */
  async recognizeProduct(imageUrl: string): Promise<RecognitionResult | null> {
    try {
      if (!this.apiKey) {
        this.logger.warn('Roboflow API key not configured');
        return null;
      }

      this.logger.log(`Processing image with Roboflow: ${imageUrl}`);

      // Call Roboflow API for product detection
      const response = await this.callRoboflowAPI(imageUrl);
      
      if (!response || !response.predictions || response.predictions.length === 0) {
        return null;
      }

      // Process the response to extract product information
      const productInfo = this.extractProductInfo(response);

      if (!productInfo) {
        return null;
      }

      const result: RecognitionResult = {
        provider: 'roboflow',
        productName: productInfo.name,
        brand: productInfo.brand,
        category: productInfo.category,
        confidence: productInfo.confidence,
        boundingBox: productInfo.boundingBox,
        rawResponse: response,
      };

      this.logger.log(`Roboflow recognition completed: ${productInfo.name} (${productInfo.confidence})`);
      return result;
    } catch (error) {
      this.logger.error('Roboflow recognition failed:', error);
      return null;
    }
  }

  /**
   * Call Roboflow API
   */
  private async callRoboflowAPI(imageUrl: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/retail-products/1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Roboflow API call failed:', error);
      throw error;
    }
  }

  /**
   * Extract product information from Roboflow response
   */
  private extractProductInfo(response: any): {
    name: string;
    brand: string;
    category: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  } | null {
    const predictions = response.predictions || [];
    
    if (predictions.length === 0) {
      return null;
    }

    // Get the prediction with highest confidence
    const topPrediction = predictions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // Extract product information
    const productName = this.mapClassToProductName(topPrediction.class);
    const category = this.mapClassToCategory(topPrediction.class);
    const brand = this.extractBrandFromClass(topPrediction.class);

    // Calculate bounding box
    const boundingBox = {
      x: topPrediction.x - topPrediction.width / 2,
      y: topPrediction.y - topPrediction.height / 2,
      width: topPrediction.width,
      height: topPrediction.height,
    };

    return {
      name: productName,
      brand: brand || 'Unknown',
      category: category || 'Unknown',
      confidence: Math.min(topPrediction.confidence, 0.95),
      boundingBox,
    };
  }

  /**
   * Map Roboflow class to product name
   */
  private mapClassToProductName(className: string): string {
    const classMappings: { [key: string]: string } = {
      'sneakers': 'Sneakers',
      'boots': 'Boots',
      'sandals': 'Sandals',
      'heels': 'Heels',
      'flats': 'Flats',
      't-shirt': 'T-Shirt',
      'shirt': 'Shirt',
      'pants': 'Pants',
      'jeans': 'Jeans',
      'dress': 'Dress',
      'jacket': 'Jacket',
      'hoodie': 'Hoodie',
      'sweater': 'Sweater',
      'shorts': 'Shorts',
      'skirt': 'Skirt',
      'phone': 'Smartphone',
      'laptop': 'Laptop',
      'tablet': 'Tablet',
      'headphones': 'Headphones',
      'watch': 'Watch',
      'bag': 'Bag',
      'backpack': 'Backpack',
      'sunglasses': 'Sunglasses',
      'hat': 'Hat',
      'belt': 'Belt',
      'jewelry': 'Jewelry',
    };

    return classMappings[className.toLowerCase()] || className;
  }

  /**
   * Map Roboflow class to category
   */
  private mapClassToCategory(className: string): string {
    const categoryMappings: { [key: string]: string } = {
      'sneakers': 'Footwear',
      'boots': 'Footwear',
      'sandals': 'Footwear',
      'heels': 'Footwear',
      'flats': 'Footwear',
      't-shirt': 'Clothing',
      'shirt': 'Clothing',
      'pants': 'Clothing',
      'jeans': 'Clothing',
      'dress': 'Clothing',
      'jacket': 'Clothing',
      'hoodie': 'Clothing',
      'sweater': 'Clothing',
      'shorts': 'Clothing',
      'skirt': 'Clothing',
      'phone': 'Electronics',
      'laptop': 'Electronics',
      'tablet': 'Electronics',
      'headphones': 'Electronics',
      'watch': 'Electronics',
      'bag': 'Accessories',
      'backpack': 'Accessories',
      'sunglasses': 'Accessories',
      'hat': 'Accessories',
      'belt': 'Accessories',
      'jewelry': 'Accessories',
    };

    return categoryMappings[className.toLowerCase()] || 'Unknown';
  }

  /**
   * Extract brand from class name
   */
  private extractBrandFromClass(className: string): string | null {
    const brandKeywords = [
      'nike', 'adidas', 'puma', 'reebok', 'converse', 'vans',
      'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo',
      'gucci', 'prada', 'louis vuitton', 'chanel', 'hermes',
      'zara', 'h&m', 'uniqlo', 'gap', 'old navy',
    ];

    const lowerClassName = className.toLowerCase();
    const foundBrand = brandKeywords.find(brand => 
      lowerClassName.includes(brand)
    );

    return foundBrand || null;
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      if (!this.apiKey) {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
        };
      }

      // Test with a simple image
      const testImageUrl = 'https://via.placeholder.com/100x100.png';
      await this.callRoboflowAPI(testImageUrl);
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Roboflow health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}