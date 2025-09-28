import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService, SearchOptions } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('products')
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Products found successfully' })
  async searchProducts(@Body() searchOptions: SearchOptions) {
    return await this.searchService.searchProducts(searchOptions);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get product suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  async getSuggestions(@Query('q') query: string, @Query('limit') limit = 10) {
    return await this.searchService.getSuggestions(query, limit);
  }

  @Get('similar/:productId')
  @ApiOperation({ summary: 'Get similar products' })
  @ApiResponse({ status: 200, description: 'Similar products found' })
  async getSimilarProducts(@Query('productId') productId: string, @Query('limit') limit = 10) {
    return await this.searchService.getSimilarProducts(productId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get search index statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getIndexStats() {
    return await this.searchService.getIndexStats();
  }
}