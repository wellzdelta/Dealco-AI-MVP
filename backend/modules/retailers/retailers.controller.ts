import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RetailersService, CreateRetailerDto, UpdateRetailerDto } from './retailers.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('retailers')
@Controller('retailers')
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new retailer' })
  @ApiResponse({ status: 201, description: 'Retailer created successfully' })
  async createRetailer(@Body() createRetailerDto: CreateRetailerDto) {
    return await this.retailersService.create(createRetailerDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all retailers' })
  @ApiResponse({ status: 200, description: 'Retailers retrieved successfully' })
  async getAllRetailers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.retailersService.findAll(page, limit);
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: 'Get active retailers' })
  @ApiResponse({ status: 200, description: 'Active retailers retrieved successfully' })
  async getActiveRetailers() {
    return await this.retailersService.findActive();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get retailer by ID' })
  @ApiResponse({ status: 200, description: 'Retailer retrieved successfully' })
  async getRetailer(@Param('id') id: string) {
    return await this.retailersService.findById(id);
  }

  @Get(':id/health')
  @Public()
  @ApiOperation({ summary: 'Get retailer health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getRetailerHealth(@Param('id') id: string) {
    return await this.retailersService.getHealthStatus(id);
  }

  @Get('health/all')
  @Public()
  @ApiOperation({ summary: 'Get all retailers health status' })
  @ApiResponse({ status: 200, description: 'Health statuses retrieved successfully' })
  async getAllRetailersHealth() {
    return await this.retailersService.getAllHealthStatus();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update retailer' })
  @ApiResponse({ status: 200, description: 'Retailer updated successfully' })
  async updateRetailer(
    @Param('id') id: string,
    @Body() updateRetailerDto: UpdateRetailerDto,
  ) {
    return await this.retailersService.update(id, updateRetailerDto);
  }

  @Put(':id/health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update retailer health status' })
  @ApiResponse({ status: 200, description: 'Health status updated successfully' })
  async updateRetailerHealth(
    @Param('id') id: string,
    @Body() healthData: any,
  ) {
    await this.retailersService.updateHealthStatus(id, healthData);
    return { message: 'Health status updated successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete retailer' })
  @ApiResponse({ status: 200, description: 'Retailer deleted successfully' })
  async deleteRetailer(@Param('id') id: string) {
    await this.retailersService.delete(id);
    return { message: 'Retailer deleted successfully' };
  }

  @Get('stats/overview')
  @Public()
  @ApiOperation({ summary: 'Get retailer statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getRetailerStats() {
    return await this.retailersService.getStats();
  }
}