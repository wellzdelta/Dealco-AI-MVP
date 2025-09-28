import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, Controller, Get, Post, Body, Module } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
const helmet = require('helmet');
const compression = require('compression');

// Simple test controllers
@Controller('health')
class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: 'test',
    };
  }
}

@Controller('auth')
class AuthController {
  @Post('login')
  login(@Body() loginDto: { email: string; password: string }) {
    // Mock login response
    return {
      success: true,
      data: {
        access_token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: loginDto.email,
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
          isVerified: true,
        },
      },
    };
  }

  @Post('register')
  register(@Body() registerDto: { email: string; password: string; firstName: string; lastName: string }) {
    // Mock registration response
    return {
      success: true,
      data: {
        access_token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          isActive: true,
          isVerified: false,
        },
      },
    };
  }
}

@Controller('products')
class ProductsController {
  @Get()
  getProducts() {
    // Mock products response
    return {
      success: true,
      data: {
        products: [
          {
            id: 'product-1',
            name: 'Nike Air Force 1',
            brand: 'Nike',
            category: 'Footwear',
            averagePrice: 89.99,
            lowestPrice: 79.99,
            priceCount: 5,
            images: {
              primary: 'https://example.com/nike-af1.jpg',
            },
          },
          {
            id: 'product-2',
            name: 'iPhone 15 Pro',
            brand: 'Apple',
            category: 'Electronics',
            averagePrice: 999.99,
            lowestPrice: 949.99,
            priceCount: 3,
            images: {
              primary: 'https://example.com/iphone15.jpg',
            },
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    };
  }

  @Get('search')
  searchProducts(@Body() searchDto: { q: string; page?: number; limit?: number }) {
    // Mock search response
    return {
      success: true,
      data: {
        products: [
          {
            id: 'product-1',
            name: 'Nike Air Force 1',
            brand: 'Nike',
            category: 'Footwear',
            averagePrice: 89.99,
            lowestPrice: 79.99,
            priceCount: 5,
            images: {
              primary: 'https://example.com/nike-af1.jpg',
            },
          },
        ],
        total: 1,
        page: searchDto.page || 1,
        limit: searchDto.limit || 20,
        aggregations: {
          brands: [
            { key: 'Nike', doc_count: 1 },
          ],
          categories: [
            { key: 'Footwear', doc_count: 1 },
          ],
        },
      },
    };
  }
}

@Controller('scans')
class ScansController {
  @Post()
  createScan(@Body() scanDto: { imageUrl: string; thumbnailUrl?: string }) {
    // Mock scan response
    return {
      success: true,
      data: {
        id: 'scan-123',
        userId: 'user-123',
        imageUrl: scanDto.imageUrl,
        status: 'completed',
        confidenceScore: 0.95,
        productId: 'product-1',
        recognitionResults: [
          {
            provider: 'google_vision',
            productName: 'Nike Air Force 1',
            brand: 'Nike',
            category: 'Footwear',
            confidence: 0.95,
          },
        ],
        aiNormalization: {
          normalizedName: 'Nike Air Force 1 Low White',
          normalizedBrand: 'Nike',
          normalizedCategory: 'Footwear',
          extractedAttributes: {
            color: 'White',
            style: 'Low',
          },
        },
        priceResults: {
          totalPrices: 5,
          lowestPrice: 79.99,
          highestPrice: 99.99,
          averagePrice: 89.99,
        },
        createdAt: new Date().toISOString(),
      },
    };
  }

  @Get()
  getScans() {
    // Mock scans response
    return {
      success: true,
      data: {
        scans: [
          {
            id: 'scan-123',
            imageUrl: 'https://example.com/scan.jpg',
            status: 'completed',
            confidenceScore: 0.95,
            productId: 'product-1',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
      },
    };
  }
}

@Controller('prices')
class PricesController {
  @Get('product/:productId')
  getProductPrices() {
    // Mock prices response
    return {
      success: true,
      data: {
        product: {
          id: 'product-1',
          name: 'Nike Air Force 1 Low White',
        },
        prices: [
          {
            id: 'price-1',
            retailerId: 'retailer-1',
            price: 79.99,
            currency: 'USD',
            originalPrice: 99.99,
            discount: 20.00,
            discountPercentage: 20.0,
            productUrl: 'https://amazon.com/nike-af1',
            inStock: true,
            shippingCost: 0,
            estimatedDelivery: '2-3 days',
            retailer: {
              id: 'retailer-1',
              name: 'Amazon',
              logo: 'https://example.com/amazon-logo.png',
              trustScore: 0.95,
            },
          },
          {
            id: 'price-2',
            retailerId: 'retailer-2',
            price: 89.99,
            currency: 'USD',
            originalPrice: 89.99,
            discount: 0,
            discountPercentage: 0,
            productUrl: 'https://nike.com/af1',
            inStock: true,
            shippingCost: 0,
            estimatedDelivery: '1-2 days',
            retailer: {
              id: 'retailer-2',
              name: 'Nike',
              logo: 'https://example.com/nike-logo.png',
              trustScore: 0.98,
            },
          },
        ],
        lowestPrice: {
          price: 79.99,
          retailerId: 'retailer-1',
        },
        highestPrice: {
          price: 89.99,
          retailerId: 'retailer-2',
        },
        averagePrice: 84.99,
        totalRetailers: 2,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}

@Controller('image-recognition')
class ImageRecognitionController {
  @Post('recognize')
  recognizeProduct(@Body() recognizeDto: { imageUrl: string }) {
    // Mock recognition response
    return {
      success: true,
      data: {
        scanId: 'scan-123',
        results: [
          {
            provider: 'google_vision',
            productName: 'Nike Air Force 1',
            brand: 'Nike',
            category: 'Footwear',
            confidence: 0.95,
            boundingBox: {
              x: 100,
              y: 100,
              width: 200,
              height: 200,
            },
          },
        ],
        bestMatch: {
          provider: 'google_vision',
          productName: 'Nike Air Force 1',
          brand: 'Nike',
          category: 'Footwear',
          confidence: 0.95,
        },
        suggestedProducts: [
          {
            id: 'product-1',
            name: 'Nike Air Force 1 Low White',
            brand: 'Nike',
            category: 'Footwear',
            confidenceScore: 0.95,
          },
        ],
        processingTime: 1200,
        cacheHit: false,
      },
    };
  }
}

// Simple test module
@Module({
  controllers: [
    HealthController,
    AuthController,
    ProductsController,
    ScansController,
    PricesController,
    ImageRecognitionController,
  ],
})
export class TestModule {}

async function createMinimalTestApp() {
  const app = await NestFactory.create(TestModule, {
    logger: ['error', 'warn', 'log'],
  });

  const port = 3001;
  const apiPrefix = 'api/v1';

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dealco AI Backend API - Minimal Test')
    .setDescription('Minimal test backend for Dealco AI - mobile price comparison app')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('health', 'Health check endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management')
    .addTag('scans', 'Product scanning and recognition')
    .addTag('prices', 'Price comparison and aggregation')
    .addTag('image-recognition', 'Image recognition services')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    Logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    Logger.log('SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  await app.listen(port);
  
  Logger.log(`🚀 Dealco AI Minimal Test Backend is running on: http://localhost:${port}/${apiPrefix}`);
  Logger.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  Logger.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  
  return app;
}

export { createMinimalTestApp };