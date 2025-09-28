import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PricesService } from './prices.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get('product/:productId')
  @Public()
  @ApiOperation({ summary: 'Get prices for a product' })
  @ApiResponse({ status: 200, description: 'Prices retrieved successfully' })
  async getProductPrices(@Param('productId') productId: string) {
    return await this.pricesService.getProductPrices(productId);
  }

  @Get('history/:productId')
  @Public()
  @ApiOperation({ summary: 'Get price history for a product' })
  @ApiResponse({ status: 200, description: 'Price history retrieved successfully' })
  async getPriceHistory(
    @Param('productId') productId: string,
    @Query('retailerId') retailerId?: string,
    @Query('days') days = 30,
  ) {
    return await this.pricesService.getPriceHistory(productId, retailerId, days);
  }

  @Get('lowest')
  @Public()
  @ApiOperation({ summary: 'Get lowest prices across all retailers' })
  @ApiResponse({ status: 200, description: 'Lowest prices retrieved successfully' })
  async getLowestPrices(@Query('limit') limit = 50) {
    return await this.pricesService.getLowestPrices(limit);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: 'Get trending products with recent price changes' })
  @ApiResponse({ status: 200, description: 'Trending products retrieved successfully' })
  async getTrendingProducts(@Query('limit') limit = 20) {
    return await this.pricesService.getTrendingProducts(limit);
  }

  @Post('compare')
  @Public()
  @ApiOperation({ summary: 'Compare prices for multiple products' })
  @ApiResponse({ status: 200, description: 'Price comparison completed successfully' })
  async comparePrices(@Body() body: { productIds: string[] }) {
    return await this.pricesService.comparePrices(body.productIds);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get price alerts for users' })
  @ApiResponse({ status: 200, description: 'Price alerts retrieved successfully' })
  async getPriceAlerts() {
    return await this.pricesService.getPriceAlerts();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get price by ID' })
  @ApiResponse({ status: 200, description: 'Price retrieved successfully' })
  async getPrice(@Param('id') id: string) {
    return await this.pricesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update price' })
  @ApiResponse({ status: 200, description: 'Price updated successfully' })
  async updatePrice(
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return await this.pricesService.updatePrice(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete price' })
  @ApiResponse({ status: 200, description: 'Price deleted successfully' })
  async deletePrice(@Param('id') id: string) {
    await this.pricesService.deletePrice(id);
    return { message: 'Price deleted successfully' };
  }

  @Get('stats/overview')
  @Public()
  @ApiOperation({ summary: 'Get price statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPriceStats() {
    return await this.pricesService.getStats();
  }
}