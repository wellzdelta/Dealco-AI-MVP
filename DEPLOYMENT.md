# Deployment Guide

This guide covers deploying the Dealco AI Backend to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [AWS Deployment](#aws-deployment)
- [Google Cloud Deployment](#google-cloud-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher
- **Elasticsearch**: 8.x or higher
- **Memory**: Minimum 4GB RAM
- **Storage**: Minimum 50GB SSD
- **CPU**: Minimum 2 cores

### External Services

- Google Cloud Vision API
- Anthropic Claude API
- OpenAI API
- Roboflow API
- Retailer APIs (Amazon, Walmart, eBay, etc.)
- Scraping services (Apify, Bright Data)

## Environment Setup

### 1. Environment Variables

Create environment-specific configuration files:

#### Development (.env.development)
```env
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

#### Production (.env.production)
```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=prod-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=dealco_prod
DATABASE_PASSWORD=secure_prod_password
DATABASE_NAME=dealco_ai_prod

# Redis
REDIS_HOST=prod-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Elasticsearch
ELASTICSEARCH_NODE=https://prod-elasticsearch-host:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=secure_elastic_password

# JWT
JWT_SECRET=super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d

# AI Services
GOOGLE_CLOUD_PROJECT_ID=dealco-production
ANTHROPIC_API_KEY=sk-ant-prod-key
OPENAI_API_KEY=sk-prod-key
ROBOFLOW_API_KEY=prod-roboflow-key

# Retailer APIs
AMAZON_ACCESS_KEY=prod-amazon-key
WALMART_API_KEY=prod-walmart-key
EBAY_APP_ID=prod-ebay-key
BEST_BUY_API_KEY=prod-bestbuy-key

# Scraping Services
APIFY_API_TOKEN=prod-apify-token
BRIGHT_DATA_USERNAME=prod-bright-data-user
BRIGHT_DATA_PASSWORD=prod-bright-data-pass

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Security
CORS_ORIGIN=https://app.dealco.ai,https://admin.dealco.ai
```

### 2. Database Setup

#### PostgreSQL Configuration

```sql
-- Create database and user
CREATE DATABASE dealco_ai_prod;
CREATE USER dealco_prod WITH PASSWORD 'secure_prod_password';
GRANT ALL PRIVILEGES ON DATABASE dealco_ai_prod TO dealco_prod;

-- Create extensions
\c dealco_ai_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

#### Redis Configuration

```conf
# redis.conf
bind 0.0.0.0
port 6379
requirepass secure_redis_password
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Elasticsearch Configuration

```yaml
# elasticsearch.yml
cluster.name: dealco-ai-cluster
node.name: dealco-ai-node-1
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
      - elasticsearch
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: dealco_ai_prod
      POSTGRES_USER: dealco_prod
      POSTGRES_PASSWORD: secure_prod_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    command: redis-server --requirepass secure_redis_password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  elasticsearch:
    image: elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=secure_elastic_password
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

### 3. Nginx Configuration

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name api.dealco.ai;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.dealco.ai;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/v1/health {
            proxy_pass http://app;
            access_log off;
        }
    }
}
```

### 4. Deployment Commands

```bash
# Build and start services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run migration:run

# Seed initial data
docker-compose exec app npm run seed

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

## Kubernetes Deployment

### 1. Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dealco-ai
```

### 2. ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dealco-ai-config
  namespace: dealco-ai
data:
  NODE_ENV: "production"
  PORT: "3000"
  API_PREFIX: "api/v1"
  RATE_LIMIT_TTL: "60"
  RATE_LIMIT_LIMIT: "100"
```

### 3. Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: dealco-ai-secrets
  namespace: dealco-ai
type: Opaque
data:
  DATABASE_PASSWORD: <base64-encoded-password>
  REDIS_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-secret>
  ANTHROPIC_API_KEY: <base64-encoded-key>
  OPENAI_API_KEY: <base64-encoded-key>
```

### 4. Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dealco-ai-backend
  namespace: dealco-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dealco-ai-backend
  template:
    metadata:
      labels:
        app: dealco-ai-backend
    spec:
      containers:
      - name: backend
        image: dealco-ai/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_HOST
          value: "postgres-service"
        - name: REDIS_HOST
          value: "redis-service"
        - name: ELASTICSEARCH_NODE
          value: "http://elasticsearch-service:9200"
        envFrom:
        - configMapRef:
            name: dealco-ai-config
        - secretRef:
            name: dealco-ai-secrets
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 5. Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: dealco-ai-backend-service
  namespace: dealco-ai
spec:
  selector:
    app: dealco-ai-backend
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### 6. Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dealco-ai-ingress
  namespace: dealco-ai
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.dealco.ai
    secretName: dealco-ai-tls
  rules:
  - host: api.dealco.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dealco-ai-backend-service
            port:
              number: 80
```

## AWS Deployment

### 1. ECS Task Definition

```json
{
  "family": "dealco-ai-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "account.dkr.ecr.region.amazonaws.com/dealco-ai-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:dealco-ai/database-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/dealco-ai-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 2. ECS Service

```json
{
  "serviceName": "dealco-ai-backend-service",
  "cluster": "dealco-ai-cluster",
  "taskDefinition": "dealco-ai-backend",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345", "subnet-67890"],
      "securityGroups": ["sg-12345"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/dealco-ai-tg/12345",
      "containerName": "backend",
      "containerPort": 3000
    }
  ],
  "serviceRegistries": [
    {
      "registryArn": "arn:aws:servicediscovery:region:account:service/srv-12345"
    }
  ]
}
```

### 3. Application Load Balancer

```yaml
# CloudFormation template
Resources:
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: dealco-ai-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - subnet-12345
        - subnet-67890
      SecurityGroups:
        - sg-12345

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: dealco-ai-tg
      Port: 3000
      Protocol: HTTP
      VpcId: vpc-12345
      TargetType: ip
      HealthCheckPath: /api/v1/health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
```

## Google Cloud Deployment

### 1. Cloud Run Service

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: dealco-ai-backend
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "2"
        run.googleapis.com/cpu-throttling: "false"
        run.googleapis.com/memory: "1Gi"
        run.googleapis.com/cpu: "1"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/project-id/dealco-ai-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          value: "cloud-sql-proxy"
        - name: REDIS_HOST
          value: "redis-memorystore"
        envFrom:
        - secretKeyRef:
            name: dealco-ai-secrets
            key: DATABASE_PASSWORD
        - secretKeyRef:
            name: dealco-ai-secrets
            key: JWT_SECRET
        resources:
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2. Cloud SQL Instance

```yaml
# Cloud SQL PostgreSQL instance
gcloud sql instances create dealco-ai-db \
  --database-version=POSTGRES_14 \
  --tier=db-standard-2 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --enable-bin-log \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04 \
  --authorized-networks=0.0.0.0/0
```

### 3. Memorystore Redis

```yaml
# Redis instance
gcloud redis instances create dealco-ai-redis \
  --size=2 \
  --region=us-central1 \
  --redis-version=redis_6_x \
  --tier=standard
```

## Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Load balancer configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security groups configured
- [ ] Rate limiting configured
- [ ] CORS settings verified

### Post-Deployment

- [ ] Health checks passing
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Elasticsearch connections working
- [ ] External API integrations working
- [ ] Monitoring alerts configured
- [ ] Log aggregation working
- [ ] Performance metrics collected
- [ ] Error tracking setup
- [ ] Backup verification

### Security

- [ ] HTTPS enabled
- [ ] JWT secrets rotated
- [ ] Database passwords strong
- [ ] API keys secured
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] WAF configured
- [ ] Security headers set
- [ ] Input validation enabled
- [ ] SQL injection prevention

## Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Health check endpoint
curl https://api.dealco.ai/api/v1/health

# System health
curl https://api.dealco.ai/api/v1/monitoring/health

# Performance metrics
curl https://api.dealco.ai/api/v1/monitoring/performance
```

### 2. Log Monitoring

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f postgres

# Redis logs
docker-compose logs -f redis

# Elasticsearch logs
docker-compose logs -f elasticsearch
```

### 3. Database Maintenance

```bash
# Run migrations
npm run migration:run

# Backup database
pg_dump -h localhost -U dealco_prod dealco_ai_prod > backup.sql

# Restore database
psql -h localhost -U dealco_prod dealco_ai_prod < backup.sql
```

### 4. Cache Maintenance

```bash
# Redis info
redis-cli -h localhost -p 6379 info

# Clear cache
redis-cli -h localhost -p 6379 flushall

# Monitor Redis
redis-cli -h localhost -p 6379 monitor
```

### 5. Search Index Maintenance

```bash
# Elasticsearch health
curl -X GET "localhost:9200/_cluster/health"

# Reindex data
curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "products_old"
  },
  "dest": {
    "index": "products_new"
  }
}'
```

### 6. Performance Optimization

```bash
# Database optimization
VACUUM ANALYZE;

# Redis optimization
redis-cli --latency-history

# Elasticsearch optimization
curl -X POST "localhost:9200/products/_forcemerge?max_num_segments=1"
```

### 7. Scaling

```bash
# Horizontal scaling
docker-compose up -d --scale app=5

# Vertical scaling
# Update docker-compose.yml with more resources
# Update Kubernetes deployment with more CPU/memory
# Update Cloud Run with more instances
```

### 8. Backup Strategy

```bash
# Daily database backup
0 2 * * * pg_dump -h localhost -U dealco_prod dealco_ai_prod | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Weekly full backup
0 1 * * 0 tar -czf /backups/full_$(date +\%Y\%m\%d).tar.gz /var/lib/postgresql/data

# Monthly archive
0 0 1 * * aws s3 cp /backups/ s3://dealco-ai-backups/ --recursive
```

This deployment guide provides comprehensive instructions for deploying the Dealco AI Backend to various environments. Choose the deployment method that best fits your infrastructure and requirements.