import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScansService, CreateScanDto } from './scans.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../database/entities/user.entity';

export class CreateScanRequestDto {
  imageUrl: string;
  thumbnailUrl?: string;
  imageMetadata?: any;
}

export class UserFeedbackDto {
  isCorrect: boolean;
  correctProductId?: string;
  feedback: string;
}

@ApiTags('scans')
@Controller('scans')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scan' })
  @ApiResponse({ status: 201, description: 'Scan created successfully' })
  async createScan(
    @GetUser() user: User,
    @Body() createScanDto: CreateScanRequestDto,
  ) {
    return await this.scansService.createScan(user.id, createScanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user scan history' })
  @ApiResponse({ status: 200, description: 'Scans retrieved successfully' })
  async getUserScans(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.scansService.getUserScans(user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scan by ID' })
  @ApiResponse({ status: 200, description: 'Scan retrieved successfully' })
  async getScan(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    return await this.scansService.getScanById(id, user.id);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Add user feedback to scan' })
  @ApiResponse({ status: 200, description: 'Feedback added successfully' })
  async addUserFeedback(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() feedback: UserFeedbackDto,
  ) {
    return await this.scansService.addUserFeedback(id, user.id, feedback);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get scan statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getScanStats(@GetUser() user: User) {
    return await this.scansService.getScanStats(user.id);
  }
}