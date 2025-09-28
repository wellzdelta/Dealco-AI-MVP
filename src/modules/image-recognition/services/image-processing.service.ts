import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
  hasAlpha: boolean;
  colorSpace: string;
  channels: number;
}

export interface ProcessedImage {
  originalUrl: string;
  thumbnailUrl: string;
  compressedUrl: string;
  metadata: ImageInfo;
  hash: string;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  /**
   * Get image information
   */
  async getImageInfo(imageUrl: string): Promise<ImageInfo> {
    try {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const metadata = await sharp(buffer).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        format: metadata.format || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        channels: metadata.channels || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get image info:', error);
      throw error;
    }
  }

  /**
   * Process and optimize image
   */
  async processImage(imageUrl: string): Promise<ProcessedImage> {
    try {
      this.logger.log(`Processing image: ${imageUrl}`);

      // Download image
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Get metadata
      const metadata = await sharp(buffer).metadata();
      const imageInfo: ImageInfo = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        format: metadata.format || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        channels: metadata.channels || 0,
      };

      // Generate hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // Create thumbnail (300x300)
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Create compressed version (max 1920x1080)
      const compressedBuffer = await sharp(buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      // In a real implementation, you would upload these to cloud storage
      // For now, we'll return the original URL and mock the processed URLs
      const processedImage: ProcessedImage = {
        originalUrl: imageUrl,
        thumbnailUrl: `${imageUrl}?thumbnail=true&hash=${hash}`,
        compressedUrl: `${imageUrl}?compressed=true&hash=${hash}`,
        metadata: imageInfo,
        hash,
      };

      this.logger.log(`Image processed successfully: ${hash}`);
      return processedImage;
    } catch (error) {
      this.logger.error('Image processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate image format and size
   */
  async validateImage(imageUrl: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const imageInfo = await this.getImageInfo(imageUrl);

      // Check format
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!allowedFormats.includes(imageInfo.format.toLowerCase())) {
        errors.push(`Unsupported format: ${imageInfo.format}`);
      }

      // Check size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (imageInfo.size > maxSize) {
        errors.push(`Image too large: ${imageInfo.size} bytes (max: ${maxSize})`);
      }

      // Check dimensions
      const maxWidth = 4096;
      const maxHeight = 4096;
      if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
        errors.push(`Image too large: ${imageInfo.width}x${imageInfo.height} (max: ${maxWidth}x${maxHeight})`);
      }

      // Check minimum dimensions
      const minWidth = 100;
      const minHeight = 100;
      if (imageInfo.width < minWidth || imageInfo.height < minHeight) {
        errors.push(`Image too small: ${imageInfo.width}x${imageInfo.height} (min: ${minWidth}x${minHeight})`);
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Failed to validate image: ${error.message}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Generate image hash for caching
   */
  generateImageHash(imageUrl: string): string {
    return crypto.createHash('sha256').update(imageUrl).digest('hex');
  }

  /**
   * Extract dominant colors from image
   */
  async extractDominantColors(imageUrl: string, count = 5): Promise<string[]> {
    try {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const { data, info } = await sharp(buffer)
        .resize(150, 150)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const colors = new Map<string, number>();
      const step = info.channels;

      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Round to nearest 10 for grouping
        const roundedR = Math.round(r / 10) * 10;
        const roundedG = Math.round(g / 10) * 10;
        const roundedB = Math.round(b / 10) * 10;
        
        const colorKey = `${roundedR},${roundedG},${roundedB}`;
        colors.set(colorKey, (colors.get(colorKey) || 0) + 1);
      }

      // Sort by frequency and return top colors
      const sortedColors = Array.from(colors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([color]) => `rgb(${color})`);

      return sortedColors;
    } catch (error) {
      this.logger.error('Failed to extract dominant colors:', error);
      return [];
    }
  }

  /**
   * Detect if image contains text
   */
  async detectTextInImage(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Convert to grayscale and enhance contrast
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .normalize()
        .toBuffer();

      // Simple text detection based on edge density
      const { data, info } = await sharp(processedBuffer)
        .resize(200, 200)
        .raw()
        .toBuffer({ resolveWithObject: true });

      let edgeCount = 0;
      const threshold = 50;

      for (let i = 0; i < data.length - 1; i++) {
        if (Math.abs(data[i] - data[i + 1]) > threshold) {
          edgeCount++;
        }
      }

      // If edge density is high, likely contains text
      const edgeDensity = edgeCount / data.length;
      return edgeDensity > 0.1;
    } catch (error) {
      this.logger.error('Failed to detect text in image:', error);
      return false;
    }
  }
}