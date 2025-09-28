import { ConfigService } from '@nestjs/config';

// Mock ConfigService
export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      NODE_ENV: 'test',
      PORT: 3000,
      API_PREFIX: 'api/v1',
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: 5432,
      DATABASE_USERNAME: 'test',
      DATABASE_PASSWORD: 'test',
      DATABASE_NAME: 'test_db',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
      ELASTICSEARCH_NODE: 'http://localhost:9200',
      ELASTICSEARCH_USERNAME: '',
      ELASTICSEARCH_PASSWORD: '',
      JWT_SECRET: 'test-secret-key',
      JWT_EXPIRES_IN: '1h',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      OPENAI_API_KEY: 'test-openai-key',
      GOOGLE_CLOUD_PROJECT_ID: 'test-project',
      GOOGLE_CLOUD_CREDENTIALS_PATH: '',
      ROBOFLOW_API_KEY: 'test-roboflow-key',
      AMAZON_ACCESS_KEY: 'test-amazon-key',
      AMAZON_SECRET_KEY: 'test-amazon-secret',
      AMAZON_ASSOCIATE_TAG: 'test-associate-tag',
      WALMART_API_KEY: 'test-walmart-key',
      EBAY_APP_ID: 'test-ebay-key',
      BEST_BUY_API_KEY: 'test-bestbuy-key',
      ZALANDO_API_KEY: 'test-zalando-key',
      FARFETCH_API_KEY: 'test-farfetch-key',
      APIFY_API_TOKEN: 'test-apify-token',
      BRIGHT_DATA_USERNAME: 'test-bright-data-user',
      BRIGHT_DATA_PASSWORD: 'test-bright-data-pass',
      RATE_LIMIT_TTL: 60,
      RATE_LIMIT_LIMIT: 1000,
      PROMETHEUS_PORT: 9090,
      GRAFANA_PORT: 3001,
      CORS_ORIGIN: 'http://localhost:3000',
    };
    return config[key] || defaultValue;
  }),
} as unknown as ConfigService;

// Mock Cache Service
export const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  cacheProduct: jest.fn(),
  getCachedProduct: jest.fn(),
  cachePrices: jest.fn(),
  getCachedPrices: jest.fn(),
  cacheRetailerHealth: jest.fn(),
  getCachedRetailerHealth: jest.fn(),
  cacheSearchResults: jest.fn(),
  getCachedSearchResults: jest.fn(),
  cacheNormalizationResult: jest.fn(),
  getCachedNormalizationResult: jest.fn(),
};

// Mock Queue Service
export const mockQueueService = {
  add: jest.fn(),
  process: jest.fn(),
  getJob: jest.fn(),
  getJobs: jest.fn(),
  clean: jest.fn(),
};

// Mock Repository
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
  query: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
});

// Mock Elasticsearch Service
export const mockElasticsearchService = {
  index: jest.fn(),
  get: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  bulk: jest.fn(),
  indices: {
    create: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    stats: jest.fn(),
    refresh: jest.fn(),
  },
};

// Mock AI Services
export const mockClaudeService = {
  normalizeProduct: jest.fn(),
  deduplicateProducts: jest.fn(),
  extractProductAttributes: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockOpenAIService = {
  normalizeProduct: jest.fn(),
  deduplicateProducts: jest.fn(),
  extractProductAttributes: jest.fn(),
  getHealthStatus: jest.fn(),
};

// Mock Image Recognition Services
export const mockGoogleVisionService = {
  recognizeProduct: jest.fn(),
  detectLabels: jest.fn(),
  detectObjects: jest.fn(),
  detectText: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockRoboflowService = {
  recognizeProduct: jest.fn(),
  getHealthStatus: jest.fn(),
};

// Mock Price Engine Services
export const mockAmazonApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockWalmartApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockEbayApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockBestBuyApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockZalandoApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockFarfetchApiService = {
  searchProducts: jest.fn(),
  getProductDetails: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockScrapingService = {
  scrapeProduct: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockApifyService = {
  scrapeProduct: jest.fn(),
  getHealthStatus: jest.fn(),
};

export const mockPlaywrightService = {
  scrapeProduct: jest.fn(),
  getHealthStatus: jest.fn(),
};

// Mock JWT Service
export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
};

// Mock Logger
export const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Sample test data
export const sampleUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'hashedPassword',
  isActive: true,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const sampleProduct = {
  id: 'product-123',
  name: 'Test Product',
  description: 'A test product',
  category: 'Electronics',
  brand: 'TestBrand',
  imageUrl: 'https://example.com/image.jpg',
  createdBy: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const sampleRetailer = {
  id: 'retailer-123',
  name: 'Test Retailer',
  domain: 'test-retailer.com',
  logo: 'https://example.com/logo.png',
  country: 'US',
  currency: 'USD',
  apiConfig: {
    hasApi: true,
    apiEndpoint: 'https://api.test-retailer.com',
    apiKey: 'test-api-key',
    rateLimit: 100,
    lastUsed: new Date(),
    status: 'active' as const,
  },
  isActive: true,
  trustScore: 0.95,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const samplePrice = {
  id: 'price-123',
  productId: 'product-123',
  retailerId: 'retailer-123',
  price: 99.99,
  currency: 'USD',
  originalPrice: 129.99,
  discount: 30.00,
  discountPercentage: 23.08,
  productUrl: 'https://test-retailer.com/product/123',
  inStock: true,
  shippingCost: 0,
  estimatedDelivery: '2-3 days',
  lastUpdated: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const sampleScan = {
  id: 'scan-123',
  userId: 'user-123',
  imageUrl: 'https://example.com/scan.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  status: 'completed' as const,
  confidenceScore: 0.95,
  productId: 'product-123',
  recognitionResults: [
    {
      provider: 'google_vision',
      productName: 'Test Product',
      brand: 'TestBrand',
      category: 'Electronics',
      confidence: 0.95,
    },
  ],
  aiNormalization: {
    normalizedName: 'Test Product',
    normalizedBrand: 'TestBrand',
    normalizedCategory: 'Electronics',
    extractedAttributes: {
      color: 'Black',
      size: 'Medium',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};