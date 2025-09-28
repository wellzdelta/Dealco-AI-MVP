import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiNormalizationService, NormalizationRequest, DeduplicationRequest } from './ai-normalization.service';

@ApiTags('ai-normalization')
@Controller('ai-normalization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiNormalizationController {
  constructor(private readonly aiNormalizationService: AiNormalizationService) {}

  @Post('normalize')
  @ApiOperation({ summary: 'Normalize product information using AI' })
  @ApiResponse({ status: 200, description: 'Product normalized successfully' })
  async normalizeProduct(@Body() request: NormalizationRequest) {
    return await this.aiNormalizationService.normalizeProduct(request);
  }

  @Post('deduplicate')
  @ApiOperation({ summary: 'Deduplicate products using AI' })
  @ApiResponse({ status: 200, description: 'Products deduplicated successfully' })
  async deduplicateProducts(@Body() request: DeduplicationRequest) {
    return await this.aiNormalizationService.deduplicateProducts(request);
  }

  @Post('batch-normalize')
  @ApiOperation({ summary: 'Batch normalize multiple products' })
  @ApiResponse({ status: 200, description: 'Products normalized successfully' })
  async batchNormalizeProducts(@Body() body: { requests: NormalizationRequest[] }) {
    return await this.aiNormalizationService.batchNormalizeProducts(body.requests);
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get AI normalization statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getNormalizationStats() {
    return await this.aiNormalizationService.getNormalizationStats();
  }

  @Post('health')
  @ApiOperation({ summary: 'Get AI normalization service health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealthStatus() {
    return await this.aiNormalizationService.getHealthStatus();
  }
}