import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PriceEngineService } from './price-engine.service';

@ApiTags('price-engine')
@Controller('price-engine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PriceEngineController {
  constructor(private readonly priceEngineService: PriceEngineService) {}

  @Get('prices/:productId')
  @ApiOperation({ summary: 'Get prices for a product across all retailers' })
  @ApiResponse({ status: 200, description: 'Prices retrieved successfully' })
  async getProductPrices(@Param('productId') productId: string) {
    return await this.priceEngineService.getProductPrices(productId);
  }

  @Post('update-price')
  @ApiOperation({ summary: 'Update price for a specific product and retailer' })
  @ApiResponse({ status: 200, description: 'Price updated successfully' })
  async updateProductPrice(
    @Body() body: { productId: string; retailerId: string },
  ) {
    return await this.priceEngineService.updateProductPrice(
      body.productId,
      body.retailerId,
    );
  }

  @Post('scrape-price')
  @ApiOperation({ summary: 'Scrape product price using external services' })
  @ApiResponse({ status: 200, description: 'Price scraped successfully' })
  async scrapeProductPrice(
    @Body() body: { retailerId: string; productUrl: string; productId: string },
  ) {
    return await this.priceEngineService.scrapeProductPrice(
      body.retailerId,
      body.productUrl,
      body.productId,
    );
  }

  @Get('price-history/:productId')
  @ApiOperation({ summary: 'Get price history for a product' })
  @ApiResponse({ status: 200, description: 'Price history retrieved successfully' })
  async getPriceHistory(
    @Param('productId') productId: string,
    @Query('retailerId') retailerId?: string,
    @Query('days') days = 30,
  ) {
    return await this.priceEngineService.getPriceHistory(productId, retailerId, days);
  }

  @Get('price-alerts')
  @ApiOperation({ summary: 'Get price alerts for users' })
  @ApiResponse({ status: 200, description: 'Price alerts retrieved successfully' })
  async getPriceAlerts() {
    return await this.priceEngineService.getPriceAlerts();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get price engine statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPriceEngineStats() {
    return await this.priceEngineService.getPriceEngineStats();
  }
}