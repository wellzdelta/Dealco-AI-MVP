const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = 3001;
const apiPrefix = 'api/v1';

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoint
app.get(`/${apiPrefix}/health`, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: 'test',
  });
});

// Auth endpoints
app.post(`/${apiPrefix}/auth/login`, (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    data: {
      access_token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: email,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        isVerified: true,
      },
    },
  });
});

app.post(`/${apiPrefix}/auth/register`, (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  res.json({
    success: true,
    data: {
      access_token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: email,
        firstName: firstName,
        lastName: lastName,
        isActive: true,
        isVerified: false,
      },
    },
  });
});

// Products endpoints
app.get(`/${apiPrefix}/products`, (req, res) => {
  res.json({
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
  });
});

app.get(`/${apiPrefix}/products/search`, (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  res.json({
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
      page: parseInt(page),
      limit: parseInt(limit),
      aggregations: {
        brands: [
          { key: 'Nike', doc_count: 1 },
        ],
        categories: [
          { key: 'Footwear', doc_count: 1 },
        ],
      },
    },
  });
});

// Scans endpoints
app.post(`/${apiPrefix}/scans`, (req, res) => {
  const { imageUrl, thumbnailUrl } = req.body;
  res.json({
    success: true,
    data: {
      id: 'scan-123',
      userId: 'user-123',
      imageUrl: imageUrl,
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
  });
});

app.get(`/${apiPrefix}/scans`, (req, res) => {
  res.json({
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
  });
});

// Prices endpoints
app.get(`/${apiPrefix}/prices/product/:productId`, (req, res) => {
  const { productId } = req.params;
  res.json({
    success: true,
    data: {
      product: {
        id: productId,
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
  });
});

// Image recognition endpoints
app.post(`/${apiPrefix}/image-recognition/recognize`, (req, res) => {
  const { imageUrl } = req.body;
  res.json({
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
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
    },
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Dealco AI Express Test Backend is running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`🔍 Health Check: http://localhost:${port}/${apiPrefix}/health`);
  console.log(`📱 Test Endpoints:`);
  console.log(`   - POST ${apiPrefix}/auth/login`);
  console.log(`   - POST ${apiPrefix}/auth/register`);
  console.log(`   - GET  ${apiPrefix}/products`);
  console.log(`   - GET  ${apiPrefix}/products/search`);
  console.log(`   - POST ${apiPrefix}/scans`);
  console.log(`   - GET  ${apiPrefix}/scans`);
  console.log(`   - GET  ${apiPrefix}/prices/product/:productId`);
  console.log(`   - POST ${apiPrefix}/image-recognition/recognize`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});