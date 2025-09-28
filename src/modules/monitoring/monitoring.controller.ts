import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MonitoringService } from './monitoring.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getSystemHealth() {
    return await this.monitoringService.getSystemHealth();
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getSystemMetrics() {
    return await this.monitoringService.getSystemMetrics();
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics() {
    return await this.monitoringService.getPerformanceMetrics();
  }

  @Get('errors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get error logs' })
  @ApiResponse({ status: 200, description: 'Error logs retrieved successfully' })
  async getErrorLogs(@Query('limit') limit = 100) {
    return await this.monitoringService.getErrorLogs(limit);
  }

  @Get('audit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit trail' })
  @ApiResponse({ status: 200, description: 'Audit trail retrieved successfully' })
  async getAuditTrail(@Query('limit') limit = 100) {
    return await this.monitoringService.getAuditTrail(limit);
  }
}