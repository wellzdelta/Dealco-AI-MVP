import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function createTestApp() {
  // Create a test app with minimal configuration
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const port = 3001; // Use different port for testing
  const apiPrefix = 'api/v1';

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for testing
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

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Dealco AI Backend API - Test')
    .setDescription('Test backend for Dealco AI - mobile price comparison app')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('scan', 'Product scanning and recognition')
    .addTag('prices', 'Price comparison and aggregation')
    .addTag('products', 'Product management')
    .addTag('retailers', 'Retailer management')
    .addTag('users', 'User management')
    .addTag('monitoring', 'System monitoring and health')
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
  
  Logger.log(`🚀 Dealco AI Test Backend is running on: http://localhost:${port}/${apiPrefix}`);
  Logger.log(`📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  Logger.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  
  return app;
}

export { createTestApp };