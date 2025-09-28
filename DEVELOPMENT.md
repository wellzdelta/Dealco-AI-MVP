# Development Guide

This guide covers the development workflow, coding standards, and best practices for the Dealco AI Backend.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [API Development](#api-development)
- [Database Development](#database-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Security Best Practices](#security-best-practices)
- [Code Review Process](#code-review-process)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Elasticsearch 8.x or higher
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/dealco-ai/backend.git
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev
```

## Development Environment

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=dealco_dev
DATABASE_PASSWORD=dev_password
DATABASE_NAME=dealco_ai_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d

# AI Services
GOOGLE_CLOUD_PROJECT_ID=dealco-dev
ANTHROPIC_API_KEY=sk-ant-dev-key
OPENAI_API_KEY=sk-dev-key
ROBOFLOW_API_KEY=dev-roboflow-key

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=1000
```

### Docker Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: dealco_ai_dev
      POSTGRES_USER: dealco_dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_dev_data:/usr/share/elasticsearch/data

volumes:
  postgres_dev_data:
  redis_dev_data:
  elasticsearch_dev_data:
```

### VS Code Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["src"],
  "typescript.suggest.autoImports": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts             # Root module
├── config/                   # Configuration files
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── elasticsearch.config.ts
├── database/                 # Database layer
│   ├── entities/            # TypeORM entities
│   ├── migrations/          # Database migrations
│   ├── seeds/              # Database seeds
│   └── database.module.ts
├── common/                  # Shared utilities
│   ├── cache/              # Redis cache
│   ├── queue/              # BullMQ queues
│   ├── filters/            # Exception filters
│   ├── interceptors/       # Request/response interceptors
│   └── decorators/         # Custom decorators
├── modules/                # Feature modules
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── products/           # Product management
│   ├── retailers/          # Retailer management
│   ├── scans/              # Scan history
│   ├── prices/             # Price management
│   ├── image-recognition/  # Image processing
│   ├── price-engine/       # Price fetching
│   ├── ai-normalization/   # AI data processing
│   ├── monitoring/         # Monitoring & logging
│   └── search/             # Search functionality
└── health/                 # Health checks
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict TypeScript configuration**
2. **Prefer interfaces over types for object shapes**
3. **Use enums for constants**
4. **Avoid `any` type**
5. **Use proper generics**

```typescript
// Good
interface UserResponse {
  id: string;
  email: string;
  createdAt: Date;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// Bad
type UserResponse = {
  id: any;
  email: string;
  createdAt: any;
}
```

### NestJS Best Practices

1. **Use dependency injection**
2. **Implement proper error handling**
3. **Use guards for authorization**
4. **Implement validation pipes**
5. **Use interceptors for cross-cutting concerns**

```typescript
// Good
@Controller('users')
@UseGuards(JwtAuthGuard)
@UsePipes(ValidationPipe)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
}

// Bad
@Controller('users')
export class UsersController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Error Handling

```typescript
// Custom exception
export class ProductNotFoundException extends NotFoundException {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`);
  }
}

// Service error handling
@Injectable()
export class ProductsService {
  async findOne(id: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) {
        throw new ProductNotFoundException(id);
      }
      return product;
    } catch (error) {
      if (error instanceof ProductNotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }
}
```

### Logging

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating product: ${createProductDto.name}`);
    
    try {
      const product = await this.productRepository.save(createProductDto);
      this.logger.log(`Product created successfully: ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

## API Development

### Controller Structure

```typescript
@Controller('products')
@ApiTags('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ): Promise<ProductResponse> {
    return this.productsService.create(createProductDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PaginatedResponse<ProductResponse>> {
    return this.productsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponse> {
    return this.productsService.findOne(id);
  }
}
```

### DTOs and Validation

```typescript
// Create DTO
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Product name' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Product description', required: false })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Product category' })
  category: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Product brand', required: false })
  brand?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Product image URL', required: false })
  imageUrl?: string;
}

// Update DTO
export class UpdateProductDto extends PartialType(CreateProductDto) {}

// Response DTO
export class ProductResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  brand?: string;

  @ApiProperty()
  imageUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### Service Layer

```typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string): Promise<ProductResponse> {
    this.logger.log(`Creating product: ${createProductDto.name}`);
    
    const product = this.productRepository.create({
      ...createProductDto,
      createdBy: userId,
    });

    const savedProduct = await this.productRepository.save(product);
    
    // Invalidate cache
    await this.cacheService.del('products:all');
    
    this.logger.log(`Product created: ${savedProduct.id}`);
    return this.toResponse(savedProduct);
  }

  async findAll(page: number, limit: number): Promise<PaginatedResponse<ProductResponse>> {
    const cacheKey = `products:page:${page}:limit:${limit}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const [products, total] = await this.productRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const result = {
      data: products.map(product => this.toResponse(product)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 300); // 5 minutes
    return result;
  }

  private toResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
```

## Database Development

### Entity Design

```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => User, user => user.products)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Price, price => price.product)
  prices: Price[];
}
```

### Migration Best Practices

```typescript
// Migration file
export class CreateProductsTable1700000000000 implements MigrationInterface {
  name = 'CreateProductsTable1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['createdBy'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_PRODUCTS_CATEGORY',
            columnNames: ['category'],
          },
          {
            name: 'IDX_PRODUCTS_BRAND',
            columnNames: ['brand'],
          },
          {
            name: 'IDX_PRODUCTS_CREATED_BY',
            columnNames: ['createdBy'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('products');
  }
}
```

### Query Optimization

```typescript
// Good - Use relations and select specific fields
async findProductsWithPrices(productId: string): Promise<Product> {
  return this.productRepository.findOne({
    where: { id: productId },
    relations: ['prices', 'prices.retailer'],
    select: {
      id: true,
      name: true,
      category: true,
      prices: {
        id: true,
        price: true,
        currency: true,
        retailer: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// Good - Use query builder for complex queries
async findProductsByCategory(category: string): Promise<Product[]> {
  return this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.prices', 'price')
    .leftJoinAndSelect('price.retailer', 'retailer')
    .where('product.category = :category', { category })
    .andWhere('price.isActive = :isActive', { isActive: true })
    .orderBy('price.price', 'ASC')
    .getMany();
}

// Bad - N+1 query problem
async findProductsWithPricesBad(productIds: string[]): Promise<Product[]> {
  const products = await this.productRepository.findByIds(productIds);
  
  for (const product of products) {
    product.prices = await this.priceRepository.find({
      where: { productId: product.id },
    });
  }
  
  return products;
}
```

## Testing

### Unit Tests

```typescript
// products.service.spec.ts
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    cacheService = module.get<CacheService>(CacheService);
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        category: 'Electronics',
        description: 'A test product',
      };

      const mockProduct = {
        id: 'uuid',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockReturnValue(mockProduct as Product);
      jest.spyOn(repository, 'save').mockResolvedValue(mockProduct as Product);
      jest.spyOn(cacheService, 'del').mockResolvedValue(undefined);

      const result = await service.create(createProductDto, 'user-id');

      expect(repository.create).toHaveBeenCalledWith({
        ...createProductDto,
        createdBy: 'user-id',
      });
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
      expect(cacheService.del).toHaveBeenCalledWith('products:all');
      expect(result).toEqual(mockProduct);
    });
  });
});
```

### Integration Tests

```typescript
// products.e2e-spec.ts
describe('Products (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = authResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (POST)', () => {
    it('should create a product', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          category: 'Electronics',
          description: 'A test product',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Product');
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          name: 'Test Product',
          category: 'Electronics',
        })
        .expect(401);
    });
  });
});
```

### Test Configuration

```json
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1',
  },
};
```

## Debugging

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--detectOpenHandles"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Logging and Monitoring

```typescript
// Custom logger service
@Injectable()
export class LoggerService {
  private readonly logger = new Logger();

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }
}

// Usage in services
@Injectable()
export class ProductsService {
  constructor(
    private readonly logger: LoggerService,
    // ... other dependencies
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    this.logger.log(`Creating product: ${dto.name}`, 'ProductsService');
    
    try {
      const product = await this.productRepository.save(dto);
      this.logger.log(`Product created: ${product.id}`, 'ProductsService');
      return product;
    } catch (error) {
      this.logger.error(`Failed to create product: ${error.message}`, error.stack, 'ProductsService');
      throw error;
    }
  }
}
```

## Performance Optimization

### Database Optimization

```typescript
// Use indexes
@Entity('products')
@Index(['category', 'brand'])
@Index(['createdAt'])
export class Product {
  // ... entity definition
}

// Optimize queries
async findProductsOptimized(filters: ProductFilters): Promise<Product[]> {
  const queryBuilder = this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.prices', 'price', 'price.isActive = :isActive', { isActive: true })
    .leftJoinAndSelect('price.retailer', 'retailer');

  if (filters.category) {
    queryBuilder.andWhere('product.category = :category', { category: filters.category });
  }

  if (filters.brand) {
    queryBuilder.andWhere('product.brand = :brand', { brand: filters.brand });
  }

  if (filters.minPrice) {
    queryBuilder.andWhere('price.price >= :minPrice', { minPrice: filters.minPrice });
  }

  return queryBuilder
    .orderBy('price.price', 'ASC')
    .limit(50)
    .getMany();
}
```

### Caching Strategy

```typescript
@Injectable()
export class ProductsService {
  constructor(
    private readonly cacheService: CacheService,
    // ... other dependencies
  ) {}

  async findOne(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const product = await this.productRepository.findOne({ where: { id } });
    
    if (product) {
      await this.cacheService.set(cacheKey, product, 300); // 5 minutes
    }
    
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.save({ id, ...dto });
    
    // Invalidate related caches
    await this.cacheService.del(`product:${id}`);
    await this.cacheService.del('products:all');
    
    return product;
  }
}
```

### Async Processing

```typescript
// Queue service for heavy operations
@Injectable()
export class ProductsService {
  constructor(
    private readonly queueService: QueueService,
    // ... other dependencies
  ) {}

  async processImageRecognition(imageUrl: string, productId: string): Promise<void> {
    await this.queueService.add('image-recognition', {
      imageUrl,
      productId,
    });
  }

  async updatePrices(productId: string): Promise<void> {
    await this.queueService.add('price-update', {
      productId,
    });
  }
}

// Queue processor
@Processor('image-recognition')
export class ImageRecognitionProcessor {
  constructor(
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly productsService: ProductsService,
  ) {}

  @Process('image-recognition')
  async handleImageRecognition(job: Job<{ imageUrl: string; productId: string }>) {
    const { imageUrl, productId } = job.data;
    
    try {
      const result = await this.imageRecognitionService.recognizeProduct(imageUrl);
      await this.productsService.updateProductData(productId, result);
    } catch (error) {
      throw new Error(`Image recognition failed: ${error.message}`);
    }
  }
}
```

## Security Best Practices

### Input Validation

```typescript
// DTO validation
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  @ApiProperty({ description: 'Product name' })
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  @ApiProperty({ description: 'Product description', required: false })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Electronics', 'Clothing', 'Home', 'Sports'])
  @ApiProperty({ description: 'Product category' })
  category: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({ description: 'Product image URL', required: false })
  imageUrl?: string;
}

// Custom validation pipe
@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    });
  }
}
```

### Authentication and Authorization

```typescript
// JWT Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

// Role-based authorization
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductsController {
  // ... controller methods
}
```

### Rate Limiting

```typescript
// Custom rate limiter
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id || req.ip;
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const { req } = context.switchToHttp().getRequest();
    
    // Different limits for different user types
    if (req.user?.isPremium) {
      return super.handleRequest(context, limit * 2, ttl);
    }
    
    return super.handleRequest(context, limit, ttl);
  }
}
```

## Code Review Process

### Review Checklist

- [ ] Code follows TypeScript and NestJS best practices
- [ ] Proper error handling and logging
- [ ] Input validation and sanitization
- [ ] Security considerations (auth, authorization, rate limiting)
- [ ] Performance optimization (queries, caching, async processing)
- [ ] Unit tests with good coverage
- [ ] Integration tests for API endpoints
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Environment variables properly configured

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Security
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] Rate limiting considered
- [ ] SQL injection prevention verified

## Performance
- [ ] Database queries optimized
- [ ] Caching implemented where appropriate
- [ ] Async processing used for heavy operations

## Checklist
- [ ] Code follows project standards
- [ ] Documentation updated
- [ ] Environment variables documented
- [ ] Migration files included if needed
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U dealco_dev -d dealco_ai_dev

# Reset database
npm run migration:revert
npm run migration:run
npm run seed
```

#### Redis Connection Issues

```bash
# Check Redis status
redis-cli ping

# Check Redis logs
sudo journalctl -u redis

# Clear Redis cache
redis-cli flushall
```

#### Elasticsearch Issues

```bash
# Check Elasticsearch status
curl -X GET "localhost:9200/_cluster/health"

# Check indices
curl -X GET "localhost:9200/_cat/indices"

# Recreate index
curl -X DELETE "localhost:9200/products"
curl -X PUT "localhost:9200/products"
```

#### Memory Issues

```bash
# Check memory usage
free -h
docker stats

# Increase Node.js memory limit
node --max-old-space-size=4096 dist/main.js
```

#### Performance Issues

```bash
# Profile application
node --prof dist/main.js

# Check slow queries
# Enable slow query log in PostgreSQL
# Monitor Redis latency
redis-cli --latency-history

# Check Elasticsearch performance
curl -X GET "localhost:9200/_nodes/stats"
```

### Debug Commands

```bash
# Development
npm run start:dev

# Debug mode
npm run start:debug

# Test with coverage
npm run test:cov

# Lint and fix
npm run lint
npm run lint:fix

# Build
npm run build

# Production
npm run start:prod
```

This development guide provides comprehensive instructions for developing, testing, and maintaining the Dealco AI Backend. Follow these guidelines to ensure code quality, security, and performance.