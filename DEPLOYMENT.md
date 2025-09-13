# 🚀 Deployment Guide

This guide covers deploying the Premium Chat App to various environments.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain name (for production)
- SSL certificates (for HTTPS)
- Basic knowledge of server administration

## 🏠 Local Development

### Quick Start
```bash
# Clone and start
git clone <repository-url>
cd premium-chat-app
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Development with Hot Reload
```bash
# Start only infrastructure services
docker-compose up -d postgres redis minio

# Run backend in development mode
cd backend
npm install
npm run dev

# Run frontend in development mode (new terminal)
cd frontend
npm install
npm run dev
```

## 🌐 Production Deployment

### 1. Server Setup

#### Ubuntu/Debian Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply docker group changes
```

### 2. Environment Configuration

```bash
# Create production environment file
cp env.example .env.production

# Edit with production values
nano .env.production
```

**Production Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://username:password@postgres:5432/chat_app"
REDIS_URL="redis://redis:6379"

# JWT (Generate strong secrets)
JWT_SECRET="your-super-secure-jwt-secret-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-here"

# File Storage
STORAGE_TYPE="s3"
S3_BUCKET="your-chat-app-bucket"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"

# Server
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://yourdomain.com"

# Frontend
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com"
```

### 3. SSL Certificate Setup

#### Using Let's Encrypt with Certbot
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: chat_app
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - chat-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - chat-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/chat_app
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      STORAGE_TYPE: s3
      S3_BUCKET: ${S3_BUCKET}
      S3_REGION: ${S3_REGION}
      S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID}
      S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY}
      PORT: 3001
      CORS_ORIGIN: ${CORS_ORIGIN}
    volumes:
      - backend_uploads:/app/uploads
    networks:
      - chat-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL}
    networks:
      - chat-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    networks:
      - chat-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  backend_uploads:

networks:
  chat-network:
    driver: bridge
```

### 5. Deploy to Production

```bash
# Set environment
export COMPOSE_FILE=docker-compose.prod.yml

# Build and start services
docker-compose up -d --build

# Initialize database
docker-compose exec backend npx prisma db push
docker-compose exec backend npx prisma db seed

# Check status
docker-compose ps
docker-compose logs -f
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. ECS with Fargate
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name chat-app-cluster

# Create task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service --cluster chat-app-cluster --service-name chat-app-service --task-definition chat-app:1 --desired-count 1
```

#### 2. RDS Database Setup
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier chat-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-secure-password \
  --allocated-storage 20
```

#### 3. ElastiCache Redis Setup
```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id chat-app-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Google Cloud Platform

#### 1. Cloud Run Deployment
```bash
# Build and push images
gcloud builds submit --tag gcr.io/PROJECT_ID/chat-app-backend ./backend
gcloud builds submit --tag gcr.io/PROJECT_ID/chat-app-frontend ./frontend

# Deploy to Cloud Run
gcloud run deploy chat-app-backend --image gcr.io/PROJECT_ID/chat-app-backend
gcloud run deploy chat-app-frontend --image gcr.io/PROJECT_ID/chat-app-frontend
```

#### 2. Cloud SQL Setup
```bash
# Create Cloud SQL instance
gcloud sql instances create chat-app-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1
```

### DigitalOcean

#### 1. App Platform Deployment
```yaml
# .do/app.yaml
name: chat-app
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/chat-app
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${db.DATABASE_URL}

- name: frontend
  source_dir: /frontend
  github:
    repo: your-username/chat-app
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NEXT_PUBLIC_API_URL
    value: ${backend.PUBLIC_URL}

databases:
- name: db
  engine: PG
  version: "15"
```

## 🔧 Monitoring and Logging

### Application Monitoring

#### 1. Health Checks
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000
```

#### 2. Log Management
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Log rotation
docker-compose exec backend logrotate /etc/logrotate.conf
```

#### 3. Performance Monitoring
```bash
# Install monitoring tools
docker-compose exec backend npm install --save @sentry/node
docker-compose exec frontend npm install --save @sentry/nextjs
```

### Database Monitoring

```bash
# Database performance
docker-compose exec postgres psql -U postgres -d chat_app -c "
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
"
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/chat-app
          git pull origin main
          docker-compose -f docker-compose.prod.yml up -d --build
          docker-compose exec backend npx prisma db push
```

## 🛡️ Security Checklist

### Production Security
- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Database credentials secured
- [ ] File upload restrictions configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitoring and alerting setup

### Environment Variables Security
```bash
# Use secrets management
docker secret create jwt_secret ./secrets/jwt_secret.txt
docker secret create db_password ./secrets/db_password.txt
```

## 📊 Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres chat_app > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres chat_app < backup_file.sql
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * cd /path/to/chat-app && docker-compose exec postgres pg_dump -U postgres chat_app > backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps postgres
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec postgres psql -U postgres -c "SELECT 1;"
   ```

2. **WebSocket Connection Issues**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test WebSocket
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:3001/socket.io/
   ```

3. **File Upload Issues**
   ```bash
   # Check storage permissions
   docker-compose exec backend ls -la /app/uploads
   
   # Check MinIO status
   docker-compose ps minio
   ```

### Performance Issues

1. **High Memory Usage**
   ```bash
   # Check container stats
   docker stats
   
   # Optimize Node.js memory
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```

2. **Slow Database Queries**
   ```bash
   # Enable query logging
   docker-compose exec postgres psql -U postgres -c "ALTER SYSTEM SET log_statement = 'all';"
   docker-compose restart postgres
   ```

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review security configurations

---

**Happy Deploying! 🚀**
