# Enterprise Crypto - Deployment Runbook

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment (NorthFlank)](#production-deployment-northflank)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **Python**: Version 3.9 or higher
- **Docker**: Version 20.x or higher
- **Docker Compose**: Version 2.x or higher
- **Git**: Latest stable version

### Development Tools
- **VS Code**: Recommended IDE with extensions:
  - TypeScript and JavaScript Language Features
  - Docker
  - GitLens
  - Thunder Client (for API testing)

### System Requirements
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 10GB free space
- **Network**: Stable internet connection for package downloads

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd enterprise-crypto
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env
cp .env.production.example .env.production
cp .env.staging.example .env.staging

# Edit environment files with your configuration
nano .env
```

### 5. Database Setup (Supabase)
1. Create a new Supabase project
2. Run database migrations:
```bash
cd supabase
supabase db push
cd ..
```

## Local Development

### 1. Start Development Servers
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python app.py

# Terminal 3: Supabase (optional)
cd supabase
supabase start
```

### 2. Access Local Services
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Supabase Studio**: http://localhost:54323
- **API Documentation**: http://localhost:8000/docs

### 3. Development Commands
```bash
# Install new dependencies
npm install <package-name>

# Run type checking
npm run build

# Run linting
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Docker Deployment

### 1. Build Docker Images
```bash
# Build frontend image
docker build -f Dockerfile.frontend -t enterprise-crypto-frontend .

# Build backend image (if needed)
docker build -t enterprise-crypto-backend ./backend
```

### 2. Run with Docker Compose
```bash
# Development environment
docker-compose up -d

# Production environment
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Trading environment
docker-compose -f docker-compose.trading.yml up -d
```

### 3. Docker Commands
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up -d --build frontend

# Access container shell
docker-compose exec frontend sh
```

### 4. Environment Variables for Docker
Create `.env` file with:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Feature Flags
VITE_ENABLE_TRADING=true
VITE_ENABLE_BACKTEST=true
VITE_ENABLE_AI_FEATURES=true
```

## Production Deployment (NorthFlank)

### 1. Prepare for Deployment
```bash
# Build production assets
npm run build

# Create production environment file
cp .env.production.example .env.production
# Edit with production values

# Test production build locally
npm run preview
```

### 2. NorthFlank Configuration

#### Frontend Service
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview`
- **Port**: 5173
- **Environment Variables**: Configure all production variables

#### Backend Service
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Port**: 8000
- **Environment Variables**: Configure backend-specific variables

#### Database
- **Service**: Supabase (managed)
- **Migrations**: Run via Supabase dashboard or CLI

### 3. Deployment Steps
1. **Push latest code to repository**
2. **Update NorthFlank environment variables**
3. **Trigger deployment in NorthFlank dashboard**
4. **Monitor deployment logs**
5. **Verify service health**

### 4. Production Environment Variables
```bash
# Supabase (Production)
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# API URLs
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Security
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Trading (if enabled)
VITE_ENABLE_TRADING=true
VITE_TRADING_ENV=production
```

## Rollback Procedures

### 1. Quick Rollback (NorthFlank)
1. Go to NorthFlank dashboard
2. Select the service to rollback
3. Click "Deployments" tab
4. Select previous successful deployment
5. Click "Redeploy"

### 2. Manual Rollback
```bash
# Checkout previous commit
git checkout <previous-commit-hash>

# Redeploy
docker-compose down
docker-compose up -d --build

# Or push to trigger CI/CD
git push origin main
```

### 3. Database Rollback
```bash
# Using Supabase migrations
supabase db reset

# Or specific migration
supabase migration down <migration-name>
```

### 4. Verification After Rollback
```bash
# Check service health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Run smoke tests
npm run test:e2e:manual
```

## Troubleshooting Guide

### Common Issues

#### 1. Frontend Build Failures
**Symptoms**: Build errors during `npm run build`

**Solutions**:
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm audit
```

#### 2. Backend Connection Issues
**Symptoms**: API calls failing, connection refused

**Solutions**:
```bash
# Check backend status
curl http://localhost:8000/health

# Check logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

#### 3. Database Connection Issues
**Symptoms**: Supabase connection errors

**Solutions**:
```bash
# Check Supabase status
supabase status

# Reset local Supabase
supabase db reset

# Check environment variables
echo $SUPABASE_URL
```

#### 4. Docker Issues
**Symptoms**: Container won't start, port conflicts

**Solutions**:
```bash
# Check running containers
docker ps

# Stop all containers
docker-compose down

# Remove orphaned containers
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache
```

#### 5. Environment Variable Issues
**Symptoms**: Missing configuration, feature flags not working

**Solutions**:
```bash
# Verify environment files
cat .env

# Check required variables
grep -r "VITE_" src/ | grep "process.env"

# Restart services after changes
docker-compose restart
```

### Performance Issues

#### 1. Slow Build Times
```bash
# Use npm cache
npm config set cache ~/.npm-cache

# Parallel builds
npm run build --parallel

# Docker build optimization
docker build --progress=plain .
```

#### 2. Memory Issues
```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
docker stats
```

### Monitoring and Logs

#### 1. Application Logs
```bash
# Frontend logs
docker-compose logs -f frontend

# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f
```

#### 2. Health Checks
```bash
# Frontend health
curl http://localhost:5173

# Backend health
curl http://localhost:8000/health

# Database health
curl http://localhost:8000/health/db
```

#### 3. Performance Monitoring
```bash
# Check resource usage
docker stats

# Monitor API response times
curl -w "@curl-format.txt" http://localhost:8000/api/strategies
```

### Emergency Procedures

#### 1. Complete Service Outage
1. Check all services: `docker-compose ps`
2. Restart all services: `docker-compose restart`
3. Check system resources: `docker system df`
4. If needed, redeploy from scratch

#### 2. Database Issues
1. Check Supabase status dashboard
2. Verify connection strings
3. Run database health check
4. Consider database reset if corrupted

#### 3. Security Incidents
1. Rotate all API keys
2. Review access logs
3. Update environment variables
4. Force logout all users

## Contact and Support

- **Development Team**: [team-contact@company.com]
- **DevOps Team**: [devops@company.com]
- **Emergency**: [emergency@company.com]

## Documentation Updates

This runbook should be updated when:
- New deployment procedures are added
- Environment variables change
- New troubleshooting steps are discovered
- Architecture changes occur

Last updated: 2025-01-04
Version: 1.0.0
