import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { RecognitionResult } from '../image-recognition.service';

@Injectable()
export class GoogleVisionService {
  private readonly logger = new Logger(GoogleVisionService.name);
  private readonly client: ImageAnnotatorClient;

  constructor(private readonly configService: ConfigService) {
    // Initialize Google Vision client
    this.client = new ImageAnnotatorClient({
      projectId: this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID'),
      keyFilename: this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
    });
  }

  /**
   * Recognize product in image using Google Vision API
   */
  async recognizeProduct(imageUrl: string): Promise<RecognitionResult | null> {
    try {
      this.logger.log(`Processing image with Google Vision: ${imageUrl}`);

      // Perform multiple types of detection
      const [labelResults, objectResults, textResults, webResults] = await Promise.all([
        this.detectLabels(imageUrl),
        this.detectObjects(imageUrl),
        this.detectText(imageUrl),
        this.detectWebEntities(imageUrl),
      ]);

      // Combine results to identify the product
      const productInfo = this.extractProductInfo({
        labels: labelResults,
        objects: objectResults,
        text: textResults,
        web: webResults,
      });

      if (!productInfo) {
        return null;
      }

      const result: RecognitionResult = {
        provider: 'google_vision',
        productName: productInfo.name,
        brand: productInfo.brand,
        category: productInfo.category,
        confidence: productInfo.confidence,
        boundingBox: productInfo.boundingBox,
        rawResponse: {
          labels: labelResults,
          objects: objectResults,
          text: textResults,
          web: webResults,
        },
      };

      this.logger.log(`Google Vision recognition completed: ${productInfo.name} (${productInfo.confidence})`);
      return result;
    } catch (error) {
      this.logger.error('Google Vision recognition failed:', error);
      return null;
    }
  }

  /**
   * Detect labels in image
   */
  private async detectLabels(imageUrl: string): Promise<any[]> {
    try {
      const [result] = await this.client.labelDetection({
        image: { source: { imageUri: imageUrl } },
        imageContext: { maxResults: 20 },
      });

      return result.labelAnnotations || [];
    } catch (error) {
      this.logger.error('Label detection failed:', error);
      return [];
    }
  }

  /**
   * Detect objects in image
   */
  private async detectObjects(imageUrl: string): Promise<any[]> {
    try {
      const [result] = await this.client.objectLocalization({
        image: { source: { imageUri: imageUrl } },
        imageContext: { maxResults: 10 },
      });

      return result.localizedObjectAnnotations || [];
    } catch (error) {
      this.logger.error('Object detection failed:', error);
      return [];
    }
  }

  /**
   * Detect text in image
   */
  private async detectText(imageUrl: string): Promise<any[]> {
    try {
      const [result] = await this.client.textDetection({
        image: { source: { imageUri: imageUrl } },
      });

      return result.textAnnotations || [];
    } catch (error) {
      this.logger.error('Text detection failed:', error);
      return [];
    }
  }

  /**
   * Detect web entities
   */
  private async detectWebEntities(imageUrl: string): Promise<any[]> {
    try {
      const [result] = await this.client.webDetection({
        image: { source: { imageUri: imageUrl } },
        imageContext: { maxResults: 20 },
      });

      return result.webDetection?.webEntities || [];
    } catch (error) {
      this.logger.error('Web entity detection failed:', error);
      return [];
    }
  }

  /**
   * Extract product information from Google Vision results
   */
  private extractProductInfo(results: {
    labels: any[];
    objects: any[];
    text: any[];
    web: any[];
  }): {
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
    const { labels, objects, text, web } = results;

    // Extract product name from text or web entities
    let productName = '';
    let brand = '';
    let category = '';
    let confidence = 0;

    // Try to extract from web entities first (most reliable)
    if (web.length > 0) {
      const topWebEntity = web[0];
      if (topWebEntity.description && topWebEntity.score > 0.7) {
        productName = topWebEntity.description;
        confidence = topWebEntity.score;
      }
    }

    // Extract from labels if no web entity found
    if (!productName && labels.length > 0) {
      const productLabels = labels.filter(label => 
        label.description && 
        label.score > 0.5 &&
        this.isProductRelated(label.description)
      );

      if (productLabels.length > 0) {
        productName = productLabels[0].description;
        confidence = productLabels[0].score;
      }
    }

    // Extract brand from text or labels
    const brandKeywords = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo'];
    const brandLabel = labels.find(label => 
      brandKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      )
    );

    if (brandLabel) {
      brand = brandLabel.description;
    }

    // Extract category from labels
    const categoryKeywords = ['clothing', 'shoes', 'electronics', 'furniture', 'books', 'toys', 'beauty'];
    const categoryLabel = labels.find(label => 
      categoryKeywords.some(keyword => 
        label.description.toLowerCase().includes(keyword)
      )
    );

    if (categoryLabel) {
      category = categoryLabel.description;
    }

    // Get bounding box from objects if available
    let boundingBox;
    if (objects.length > 0) {
      const topObject = objects[0];
      if (topObject.boundingPoly) {
        const vertices = topObject.boundingPoly.normalizedVertices;
        if (vertices.length >= 4) {
          boundingBox = {
            x: vertices[0].x,
            y: vertices[0].y,
            width: vertices[2].x - vertices[0].x,
            height: vertices[2].y - vertices[0].y,
          };
        }
      }
    }

    if (!productName) {
      return null;
    }

    return {
      name: productName,
      brand: brand || 'Unknown',
      category: category || 'Unknown',
      confidence: Math.min(confidence, 0.95), // Cap confidence at 95%
      boundingBox,
    };
  }

  /**
   * Check if a label is product-related
   */
  private isProductRelated(description: string): boolean {
    const productKeywords = [
      'product', 'item', 'object', 'thing', 'clothing', 'shoes', 'electronics',
      'furniture', 'book', 'toy', 'beauty', 'cosmetics', 'jewelry', 'watch',
      'bag', 'backpack', 'phone', 'laptop', 'tablet', 'headphones', 'camera',
      'television', 'tv', 'monitor', 'keyboard', 'mouse', 'speaker', 'game',
      'console', 'controller', 'accessory', 'tool', 'equipment', 'appliance',
    ];

    return productKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      // Test with a simple image
      const testImageUrl = 'https://via.placeholder.com/100x100.png';
      await this.detectLabels(testImageUrl);
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Google Vision health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}