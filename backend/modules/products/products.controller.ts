import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService, CreateProductDto, UpdateProductDto } from './products.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, description: 'Products found successfully' })
  async searchProducts(
    @Query('q') query: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filters: any = {};
    if (brand) filters.brand = brand;
    if (category) filters.category = category;
    if (minPrice || maxPrice) {
      filters.priceRange = {
        min: minPrice || 0,
        max: maxPrice || 10000,
      };
    }

    return await this.productsService.searchProducts(query, filters, page, limit);
  }

  @Get('suggestions')
  @Public()
  @ApiOperation({ summary: 'Get product suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions retrieved successfully' })
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit = 10,
  ) {
    return await this.productsService.getSuggestions(query, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  async getProduct(@Param('id') id: string) {
    return await this.productsService.findById(id);
  }

  @Get(':id/similar')
  @Public()
  @ApiOperation({ summary: 'Get similar products' })
  @ApiResponse({ status: 200, description: 'Similar products found' })
  async getSimilarProducts(
    @Param('id') id: string,
    @Query('limit') limit = 10,
  ) {
    return await this.productsService.getSimilarProducts(id, limit);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  async deleteProduct(@Param('id') id: string) {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }

  @Get('category/:category')
  @Public()
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProductsByCategory(
    @Param('category') category: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.productsService.findByCategory(category, page, limit);
  }

  @Get('brand/:brand')
  @Public()
  @ApiOperation({ summary: 'Get products by brand' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getProductsByBrand(
    @Param('brand') brand: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.productsService.findByBrand(brand, page, limit);
  }

  @Get('stats/overview')
  @Public()
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getProductStats() {
    return await this.productsService.getStats();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all products (admin only)' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async getAllProducts(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.productsService.findAll(page, limit);
  }

  @Post('admin/bulk-index')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk index products in Elasticsearch (admin only)' })
  @ApiResponse({ status: 200, description: 'Products indexed successfully' })
  async bulkIndexProducts() {
    await this.productsService.bulkIndexProducts();
    return { message: 'Products indexed successfully' };
  }
}