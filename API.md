# Dealco AI Backend API Documentation

## Overview

The Dealco AI Backend API provides endpoints for product scanning, price comparison, and user management. All endpoints return JSON responses and follow RESTful conventions.

## Base URL

```
https://api.dealco.ai/api/v1
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 Too Many Requests

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Error Handling

Errors are returned in the following format:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint",
  "message": "Error description",
  "error": "BadRequest"
}
```

## Endpoints

### Authentication

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "isVerified": true
    }
  }
}
```

#### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "isVerified": false
    }
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "new-jwt-token-here"
  }
}
```

### Product Scanning

#### Create Scan
```http
POST /scans
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "imageMetadata": {
    "width": 1920,
    "height": 1080,
    "size": 1024000,
    "format": "jpeg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scan-123",
    "userId": "user-123",
    "imageUrl": "https://example.com/image.jpg",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Scan History
```http
GET /scans?page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scans": [
      {
        "id": "scan-123",
        "imageUrl": "https://example.com/image.jpg",
        "status": "completed",
        "confidenceScore": 0.95,
        "productId": "product-123",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 50
  }
}
```

#### Get Scan Details
```http
GET /scans/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scan-123",
    "imageUrl": "https://example.com/image.jpg",
    "status": "completed",
    "confidenceScore": 0.95,
    "recognitionResults": [
      {
        "provider": "google_vision",
        "productName": "Nike Air Force 1",
        "brand": "Nike",
        "category": "Footwear",
        "confidence": 0.95
      }
    ],
    "aiNormalization": {
      "normalizedName": "Nike Air Force 1 Low White",
      "normalizedBrand": "Nike",
      "normalizedCategory": "Footwear",
      "extractedAttributes": {
        "color": "White",
        "style": "Low"
      }
    },
    "priceResults": {
      "totalPrices": 5,
      "lowestPrice": 89.99,
      "highestPrice": 129.99,
      "averagePrice": 109.99
    }
  }
}
```

### Product Search

#### Search Products
```http
GET /products/search?q=nike+air+force&brand=Nike&category=Footwear&minPrice=50&maxPrice=200&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product-123",
        "name": "Nike Air Force 1 Low White",
        "brand": "Nike",
        "category": "Footwear",
        "averagePrice": 109.99,
        "lowestPrice": 89.99,
        "priceCount": 5,
        "images": {
          "primary": "https://example.com/image.jpg"
        }
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "aggregations": {
      "brands": [
        { "key": "Nike", "doc_count": 15 },
        { "key": "Adidas", "doc_count": 10 }
      ],
      "categories": [
        { "key": "Footwear", "doc_count": 20 },
        { "key": "Clothing", "doc_count": 5 }
      ]
    }
  }
}
```

#### Get Product Suggestions
```http
GET /products/suggestions?q=nike&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    "Nike Air Force 1",
    "Nike Air Max",
    "Nike Dunk",
    "Nike Jordan"
  ]
}
```

#### Get Product Details
```http
GET /products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Nike Air Force 1 Low White",
    "brand": "Nike",
    "category": "Footwear",
    "description": "Classic white sneakers",
    "specifications": {
      "color": "White",
      "material": "Leather",
      "size": "Various"
    },
    "images": {
      "primary": "https://example.com/image.jpg",
      "secondary": [
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg"
      ]
    },
    "averagePrice": 109.99,
    "lowestPrice": 89.99,
    "highestPrice": 129.99,
    "priceCount": 5
  }
}
```

### Price Comparison

#### Get Product Prices
```http
GET /prices/product/:productId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "product-123",
      "name": "Nike Air Force 1 Low White"
    },
    "prices": [
      {
        "id": "price-123",
        "retailerId": "retailer-123",
        "price": 89.99,
        "currency": "USD",
        "originalPrice": 109.99,
        "discount": 20.00,
        "discountPercentage": 18.18,
        "productUrl": "https://amazon.com/product",
        "inStock": true,
        "shippingCost": 0,
        "estimatedDelivery": "2-3 days",
        "retailer": {
          "id": "retailer-123",
          "name": "Amazon",
          "logo": "https://example.com/amazon-logo.png",
          "trustScore": 0.95
        }
      }
    ],
    "lowestPrice": {
      "price": 89.99,
      "retailerId": "retailer-123"
    },
    "highestPrice": {
      "price": 129.99,
      "retailerId": "retailer-456"
    },
    "averagePrice": 109.99,
    "totalRetailers": 5,
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Price History
```http
GET /prices/history/:productId?retailerId=retailer-123&days=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "history-123",
      "productId": "product-123",
      "retailerId": "retailer-123",
      "price": 89.99,
      "currency": "USD",
      "inStock": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### Get Lowest Prices
```http
GET /prices/lowest?limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "price-123",
      "price": 89.99,
      "currency": "USD",
      "product": {
        "id": "product-123",
        "name": "Nike Air Force 1 Low White"
      },
      "retailer": {
        "id": "retailer-123",
        "name": "Amazon"
      }
    }
  ]
}
```

### Image Recognition

#### Recognize Product
```http
POST /image-recognition/recognize
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scanId": "scan-123",
    "results": [
      {
        "provider": "google_vision",
        "productName": "Nike Air Force 1",
        "brand": "Nike",
        "category": "Footwear",
        "confidence": 0.95,
        "boundingBox": {
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 200
        }
      }
    ],
    "bestMatch": {
      "provider": "google_vision",
      "productName": "Nike Air Force 1",
      "brand": "Nike",
      "category": "Footwear",
      "confidence": 0.95
    },
    "suggestedProducts": [
      {
        "id": "product-123",
        "name": "Nike Air Force 1 Low White",
        "brand": "Nike",
        "category": "Footwear",
        "confidenceScore": 0.95
      }
    ],
    "processingTime": 1200,
    "cacheHit": false
  }
}
```

### User Management

#### Get User Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg",
    "isActive": true,
    "isVerified": true,
    "preferences": {
      "currency": "USD",
      "country": "US",
      "language": "en",
      "notifications": {
        "priceAlerts": true,
        "newDeals": true,
        "weeklyDigest": true
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Profile
```http
PUT /users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "preferences": {
    "currency": "EUR",
    "country": "DE",
    "language": "de"
  }
}
```

### Health & Monitoring

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production"
}
```

#### System Health
```http
GET /monitoring/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": [
    {
      "service": "database",
      "status": "healthy",
      "details": {
        "tables": {
          "users": 1000,
          "products": 50000,
          "retailers": 10
        }
      }
    },
    {
      "service": "cache",
      "status": "healthy",
      "details": {
        "hitRate": 0.75
      }
    }
  ],
  "uptime": 3600,
  "memory": {
    "rss": 100000000,
    "heapTotal": 50000000,
    "heapUsed": 30000000
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Pagination

List endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  "data": [...],
  "total": 1000,
  "page": 1,
  "limit": 20,
  "totalPages": 50
}
```

## Filtering & Sorting

### Product Search Filters

- `brand` - Filter by brand
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `inStock` - Filter by availability

### Sorting

- `sort` - Sort field
- `order` - Sort order (asc/desc)

Example:
```
GET /products/search?q=nike&sort=price&order=asc
```

## Webhooks

The API supports webhooks for real-time notifications:

### Price Alert Webhook
```json
{
  "event": "price.alert",
  "data": {
    "userId": "user-123",
    "productId": "product-123",
    "oldPrice": 99.99,
    "newPrice": 89.99,
    "retailerId": "retailer-123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Scan Complete Webhook
```json
{
  "event": "scan.complete",
  "data": {
    "scanId": "scan-123",
    "userId": "user-123",
    "status": "completed",
    "confidenceScore": 0.95,
    "productId": "product-123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `npm install @dealco-ai/sdk`
- **Python**: `pip install dealco-ai`
- **Swift**: Available via CocoaPods
- **Kotlin**: Available via Maven

## Support

- **Documentation**: [docs.dealco.ai](https://docs.dealco.ai)
- **Status Page**: [status.dealco.ai](https://status.dealco.ai)
- **Support**: support@dealco.ai
- **GitHub**: [github.com/dealco-ai/backend](https://github.com/dealco-ai/backend)