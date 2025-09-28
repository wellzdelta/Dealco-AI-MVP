import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageRecognitionService } from './image-recognition.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../../database/entities/user.entity';

export class ImageRecognitionDto {
  imageUrl: string;
}

@ApiTags('image-recognition')
@Controller('image-recognition')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImageRecognitionController {
  constructor(private readonly imageRecognitionService: ImageRecognitionService) {}

  @Post('recognize')
  @ApiOperation({ summary: 'Recognize product in image' })
  @ApiResponse({ status: 200, description: 'Product recognized successfully' })
  async recognizeProduct(
    @Body() dto: ImageRecognitionDto,
    @GetUser() user: User,
  ) {
    const imageHash = this.imageRecognitionService.generateImageHash(dto.imageUrl);
    return await this.imageRecognitionService.processImageRecognition(
      `scan-${Date.now()}`,
      dto.imageUrl,
      imageHash,
      user.id,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and recognize product image' })
  @ApiResponse({ status: 200, description: 'Image uploaded and recognized successfully' })
  async uploadAndRecognize(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    // In a real implementation, you would upload the file to cloud storage
    // and then process it for recognition
    const imageUrl = `https://storage.dealco.ai/uploads/${file.filename}`;
    const imageHash = this.imageRecognitionService.generateImageHash(imageUrl);
    
    return await this.imageRecognitionService.processImageRecognition(
      `scan-${Date.now()}`,
      imageUrl,
      imageHash,
      user.id,
    );
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate image before processing' })
  @ApiResponse({ status: 200, description: 'Image validation completed' })
  async validateImage(@Body() dto: ImageRecognitionDto) {
    return await this.imageRecognitionService.validateImage(dto.imageUrl);
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get recognition service statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getRecognitionStats() {
    return await this.imageRecognitionService.getRecognitionStats();
  }
}