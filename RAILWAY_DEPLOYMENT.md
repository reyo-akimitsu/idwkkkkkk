# 🚀 Railway Deployment Guide

Deploy your Premium Chat App to Railway in under 10 minutes!

## 🎯 Why Railway?

- ✅ **One-click deployment** from GitHub
- ✅ **Built-in PostgreSQL** and Redis
- ✅ **Automatic SSL** certificates
- ✅ **Free tier** with 500 hours/month
- ✅ **Auto-scaling** and monitoring
- ✅ **Zero configuration** required

## 📋 Prerequisites

1. **GitHub account** with your code pushed
2. **Railway account** (free at railway.app)
3. **Domain name** (optional, Railway provides free subdomain)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

```bash
# Make sure your code is on GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your chat app repository

### Step 3: Add Services

Railway will automatically detect your `docker-compose.yml` and create:

- **PostgreSQL Database** (for your chat data)
- **Redis Cache** (for sessions and real-time features)
- **Web Service** (your backend API)
- **Frontend Service** (your Next.js app)

### Step 4: Configure Environment Variables

In Railway dashboard, go to each service and add these variables:

#### Backend Service Variables:
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
STORAGE_TYPE=local
STORAGE_PATH=/app/uploads
PORT=3001
CORS_ORIGIN=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
BCRYPT_ROUNDS=12
```

#### Frontend Service Variables:
```bash
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_WS_URL=wss://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

### Step 5: Deploy!

1. Railway will automatically build and deploy your services
2. Wait for all services to show "Deployed" status
3. Your app will be available at the provided Railway URLs

### Step 6: Initialize Database

```bash
# Connect to your backend service terminal in Railway
npx prisma db push
npx prisma db seed
```

## 🔧 Railway-Specific Configuration

### Update docker-compose.yml for Railway

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      PORT: 3001
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "3001:3001"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL}
    ports:
      - "3000:3000"
```

### Create railway.json (Optional)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 🌐 Custom Domain Setup

### Step 1: Add Custom Domain

1. In Railway dashboard, go to your project
2. Click on your service
3. Go to "Settings" → "Domains"
4. Add your custom domain (e.g., `chat.yourdomain.com`)

### Step 2: Update DNS

Add these DNS records to your domain provider:

```
Type: CNAME
Name: chat
Value: your-railway-app.railway.app
```

### Step 3: Update Environment Variables

```bash
# Update CORS_ORIGIN to your custom domain
CORS_ORIGIN=https://chat.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## 📊 Monitoring & Logs

### View Logs
```bash
# In Railway dashboard
# Go to your service → "Deployments" → Click on deployment → "View Logs"
```

### Monitor Performance
- Railway provides built-in metrics
- CPU, Memory, and Network usage
- Request count and response times

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
```

### 2. Database Security
- Railway automatically handles database security
- Connections are encrypted
- Access is restricted to your services

### 3. HTTPS
- Railway provides automatic SSL certificates
- All traffic is encrypted by default

## 💰 Cost Optimization

### Free Tier Limits
- 500 hours/month per service
- 1GB RAM per service
- 1GB disk space

### Paid Plans
- **Hobby**: $5/month per service
- **Pro**: $20/month per service
- **Team**: $99/month for team features

### Cost Estimation
```
Free Tier: Perfect for development and small projects
Hobby Plan: $15/month for 3 services (PostgreSQL, Redis, Web)
Pro Plan: $60/month for production with higher limits
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**
   ```bash
   # Check Dockerfile syntax
   # Ensure all dependencies are in package.json
   # Check build logs in Railway dashboard
   ```

2. **Database Connection Issues**
   ```bash
   # Verify DATABASE_URL is set correctly
   # Check if PostgreSQL service is running
   # Run database migrations
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Ensure CORS_ORIGIN includes your frontend URL
   # Check if backend service is accessible
   # Verify WebSocket URL format (wss://)
   ```

### Debug Commands

```bash
# Connect to service terminal in Railway
# Check service status
ps aux

# Check environment variables
env | grep -E "(DATABASE|REDIS|JWT)"

# Test database connection
npx prisma db push

# Check logs
tail -f /var/log/app.log
```

## 🎉 Post-Deployment

### 1. Test Your App
- Visit your Railway URL
- Test user registration/login
- Send messages between users
- Test file uploads

### 2. Set Up Monitoring
- Enable Railway metrics
- Set up uptime monitoring (UptimeRobot)
- Configure error tracking (Sentry)

### 3. Backup Strategy
- Railway handles database backups automatically
- Export data regularly for additional safety

## 📈 Scaling

### Automatic Scaling
Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

### Manual Scaling
```bash
# In Railway dashboard
# Go to service → Settings → Resources
# Adjust CPU and Memory limits
```

## 🎯 Next Steps

1. **Deploy to Railway** using this guide
2. **Set up custom domain** for production
3. **Configure monitoring** and alerts
4. **Set up CI/CD** for automatic deployments
5. **Add error tracking** (Sentry)
6. **Set up backups** and disaster recovery

---

**Your Premium Chat App will be live on Railway in minutes! 🚀**

**Railway URL**: `https://your-app-name.railway.app`
**Custom Domain**: `https://chat.yourdomain.com`
