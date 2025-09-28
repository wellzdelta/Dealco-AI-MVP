# Dealco AI Backend

A production-grade backend system for Dealco AI, a mobile-first app that allows users to scan products and instantly compare prices across global retailers.

## 🚀 Features

- **Image Recognition**: Advanced product identification using Google Vision API and Roboflow
- **Price Engine**: Real-time price comparison across multiple retailers with API integrations and web scraping
- **AI Normalization**: Intelligent product data normalization using Claude/OpenAI
- **Search**: Fast product search with Elasticsearch
- **Caching**: Redis-based caching for optimal performance
- **Authentication**: JWT-based authentication with rate limiting
- **Monitoring**: Comprehensive monitoring and health checks
- **Scalability**: Built for millions of users with modular architecture

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Client    │    │   Admin Panel   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │   (Rate Limiting, Auth)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     NestJS Backend        │
                    │   (Core Business Logic)   │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌──────────▼──────────┐    ┌────────▼────────┐
│   PostgreSQL   │    │       Redis         │    │  Elasticsearch  │
│   (Primary DB) │    │     (Caching)       │    │    (Search)     │
└────────────────┘    └─────────────────────┘    └─────────────────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    External Services      │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   Google Vision     │  │
                    │  │   Roboflow          │  │
                    │  │   Claude/OpenAI     │  │
                    │  │   Retailer APIs     │  │
                    │  │   Scraping Services │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis with Bull Queue
- **Search**: Elasticsearch
- **AI Services**: Google Cloud Vision, Roboflow, Claude, OpenAI
- **Authentication**: JWT with Passport
- **Monitoring**: Winston logging, Prometheus metrics
- **Testing**: Jest with unit and e2e tests

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Elasticsearch 8+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dealco-ai/backend.git
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run migration:run
   
   # Seed initial data
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Development
   npm run start:dev
   
   # Production
   npm run build
   npm run start:prod
   ```

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=dealco_user
DATABASE_PASSWORD=dealco_password
DATABASE_NAME=dealco_ai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AI Services
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
ROBOFLOW_API_KEY=your-roboflow-key

# Retailer APIs
AMAZON_ACCESS_KEY=your-amazon-key
WALMART_API_KEY=your-walmart-key
# ... other retailer keys
```

## 📚 API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token

#### Product Scanning
- `POST /api/v1/scans` - Create new scan
- `GET /api/v1/scans` - Get user scan history
- `GET /api/v1/scans/:id` - Get scan details

#### Product Search
- `GET /api/v1/products/search` - Search products
- `GET /api/v1/products/suggestions` - Get suggestions
- `GET /api/v1/products/:id` - Get product details

#### Price Comparison
- `GET /api/v1/prices/product/:productId` - Get product prices
- `GET /api/v1/prices/history/:productId` - Get price history
- `GET /api/v1/prices/lowest` - Get lowest prices

#### Image Recognition
- `POST /api/v1/image-recognition/recognize` - Recognize product
- `POST /api/v1/image-recognition/upload` - Upload and recognize

### Response Format

All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Monitoring

### Health Checks
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/health/live` - Liveness check

### Metrics
- `GET /api/v1/monitoring/health` - System health
- `GET /api/v1/monitoring/metrics` - System metrics
- `GET /api/v1/monitoring/performance` - Performance metrics

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t dealco-ai-backend .

# Run container
docker run -p 3000:3000 --env-file .env dealco-ai-backend
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment

1. **Environment Setup**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure load balancer

2. **Database Migration**
   ```bash
   npm run migration:run
   ```

3. **Application Deployment**
   ```bash
   npm run build
   npm run start:prod
   ```

## 🔒 Security

- JWT-based authentication
- Rate limiting (100 requests/minute)
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- SQL injection prevention with TypeORM

## 📈 Performance

- Redis caching for frequent queries
- Database connection pooling
- Elasticsearch for fast search
- Background job processing with Bull
- Response compression
- CDN integration ready

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs.dealco.ai](https://docs.dealco.ai)
- Issues: [GitHub Issues](https://github.com/dealco-ai/backend/issues)
- Email: support@dealco.ai

## 🗺️ Roadmap

- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile SDK
- [ ] White-label solutions

---

Built with ❤️ by the Dealco AI team