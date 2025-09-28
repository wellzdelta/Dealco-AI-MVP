import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { NormalizationRequest, NormalizationResult, DeduplicationRequest, DeduplicationResult } from '../ai-normalization.service';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly client: Anthropic;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  /**
   * Normalize product information using Claude
   */
  async normalizeProduct(request: NormalizationRequest): Promise<NormalizationResult> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Claude API not configured');
      }

      this.logger.log(`Normalizing product with Claude: ${request.productName}`);

      const prompt = this.buildNormalizationPrompt(request);
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = this.parseNormalizationResponse(content.text);
      
      this.logger.log(`Claude normalization completed: ${result.normalizedName}`);
      return result;
    } catch (error) {
      this.logger.error('Claude normalization failed:', error);
      throw error;
    }
  }

  /**
   * Deduplicate products using Claude
   */
  async deduplicateProducts(request: DeduplicationRequest): Promise<DeduplicationResult> {
    try {
      if (!this.isConfigured()) {
        throw new Error('Claude API not configured');
      }

      this.logger.log(`Deduplicating products with Claude: ${request.products.length} products`);

      const prompt = this.buildDeduplicationPrompt(request);
      
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = this.parseDeduplicationResponse(content.text);
      
      this.logger.log(`Claude deduplication completed: ${result.groups.length} groups found`);
      return result;
    } catch (error) {
      this.logger.error('Claude deduplication failed:', error);
      throw error;
    }
  }

  /**
   * Build normalization prompt for Claude
   */
  private buildNormalizationPrompt(request: NormalizationRequest): string {
    return `
You are an expert product data normalization specialist. Your task is to normalize and standardize product information for a price comparison platform.

Product Information:
- Name: ${request.productName}
- Brand: ${request.brand || 'Not specified'}
- Category: ${request.category || 'Not specified'}
- Description: ${request.description || 'Not provided'}
- Specifications: ${JSON.stringify(request.specifications || {})}
- Attributes: ${JSON.stringify(request.attributes || {})}

Please normalize this product information and return a JSON response with the following structure:

{
  "normalizedName": "Standardized product name (e.g., 'Nike Air Force 1 Low White')",
  "normalizedBrand": "Standardized brand name (e.g., 'Nike')",
  "normalizedCategory": "Main category (e.g., 'Footwear')",
  "normalizedSubcategory": "Subcategory if applicable (e.g., 'Sneakers')",
  "extractedAttributes": {
    "color": "Primary color",
    "size": "Size information if available",
    "material": "Material if specified",
    "gender": "Gender if applicable (Men, Women, Unisex)",
    "ageGroup": "Age group if applicable (Adult, Kids, etc.)",
    "season": "Season if applicable (Spring, Summer, Fall, Winter)",
    "style": "Style description if available"
  },
  "confidence": 0.95
}

Guidelines:
1. Use consistent naming conventions (e.g., "Nike Air Force 1" not "Nike AF1" or "Air Force One")
2. Extract key attributes like color, size, material, gender
3. Standardize brand names (e.g., "Nike" not "nike" or "NIKE")
4. Use clear, descriptive category names
5. Set confidence based on how certain you are about the normalization
6. If information is missing or unclear, use "Unknown" or omit the field

Return only the JSON response, no additional text.
    `.trim();
  }

  /**
   * Build deduplication prompt for Claude
   */
  private buildDeduplicationPrompt(request: DeduplicationRequest): string {
    const productsText = request.products.map((product, index) => 
      `${index + 1}. ID: ${product.id}
   Name: ${product.name}
   Brand: ${product.brand}
   Category: ${product.category}
   Specifications: ${JSON.stringify(product.specifications || {})}
   Attributes: ${JSON.stringify(product.attributes || {})}`
    ).join('\n\n');

    return `
You are an expert product deduplication specialist. Your task is to identify duplicate and similar products from a list.

Products to analyze:
${productsText}

Please analyze these products and return a JSON response with the following structure:

{
  "groups": [
    {
      "products": ["product_id_1", "product_id_2"],
      "representativeProduct": "product_id_1",
      "confidence": 0.95,
      "reason": "Same product with different naming conventions"
    }
  ],
  "duplicates": [
    {
      "product1": "product_id_1",
      "product2": "product_id_2",
      "confidence": 0.90,
      "reason": "Identical products with minor variations"
    }
  ]
}

Guidelines:
1. Group products that are the same item with different names, descriptions, or minor variations
2. Identify exact duplicates (same product, same retailer, different listings)
3. Consider variations in naming, color descriptions, size formats
4. Set confidence based on how certain you are about the relationship
5. Provide clear reasons for grouping or marking as duplicates
6. A product can only be in one group
7. Focus on products that are truly the same item, not just similar

Return only the JSON response, no additional text.
    `.trim();
  }

  /**
   * Parse normalization response from Claude
   */
  private parseNormalizationResponse(responseText: string): NormalizationResult {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        normalizedName: parsed.normalizedName || 'Unknown Product',
        normalizedBrand: parsed.normalizedBrand || 'Unknown',
        normalizedCategory: parsed.normalizedCategory || 'Unknown',
        normalizedSubcategory: parsed.normalizedSubcategory,
        extractedAttributes: parsed.extractedAttributes || {},
        confidence: Math.min(parsed.confidence || 0.5, 1.0),
        provider: 'claude',
        processingTime: 0, // Will be set by caller
        cacheHit: false, // Will be set by caller
      };
    } catch (error) {
      this.logger.error('Failed to parse Claude normalization response:', error);
      throw new Error('Invalid response format from Claude');
    }
  }

  /**
   * Parse deduplication response from Claude
   */
  private parseDeduplicationResponse(responseText: string): DeduplicationResult {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        groups: parsed.groups || [],
        duplicates: parsed.duplicates || [],
        processingTime: 0, // Will be set by caller
      };
    } catch (error) {
      this.logger.error('Failed to parse Claude deduplication response:', error);
      throw new Error('Invalid response format from Claude');
    }
  }

  /**
   * Check if Claude is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get Claude service health status
   */
  async getHealthStatus(): Promise<{ status: string; lastCheck: Date }> {
    try {
      if (!this.isConfigured()) {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
        };
      }

      // Test with a simple request
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      });

      return {
        status: 'healthy',
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error('Claude health check failed:', error);
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
      };
    }
  }
}