# Enterprise Crypto - Deployment Documentation

## Overview

This directory contains comprehensive deployment and operational documentation for the Enterprise Crypto trading platform.

## 📚 Documentation Index

### 🚀 Getting Started
- **[Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)** - Complete step-by-step deployment guide
  - Prerequisites and environment setup
  - Local development setup
  - Docker deployment
  - Production deployment (NorthFlank)
  - Rollback procedures
  - Troubleshooting guide

### ⚙️ Configuration
- **[Environment Variables Reference](./ENVIRONMENT_VARIABLES.md)** - Complete configuration reference
  - Frontend variables (Supabase, API, features)
  - Backend variables (server, database, auth)
  - Trading variables (exchanges, risk management)
  - Security variables (encryption, SSL/TLS)
  - Monitoring variables (logging, analytics)
  - Environment-specific examples

### 📡 API Documentation
- **[API Quick Reference](./API_REFERENCE.md)** - Complete API documentation
  - Authentication endpoints
  - Trading endpoints (orders, positions, accounts)
  - Strategy endpoints (CRUD, backtesting)
  - Portfolio endpoints (overview, history, transactions)
  - Market data endpoints (tickers, orderbook, klines)
  - Health & monitoring endpoints
  - WebSocket API for real-time data
  - Error codes and rate limiting

## 🎯 Quick Start for Deployment

### 1. Local Development
```bash
# Clone and setup
git clone <repository-url>
cd enterprise-crypto

# Install dependencies
npm install
cd backend && pip install -r requirements.txt && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start services
npm run dev                    # Frontend
cd backend && python app.py    # Backend
```

### 2. Docker Deployment
```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Production Deployment
```bash
# Build for production
npm run build

# Deploy to NorthFlank (via dashboard or CI/CD)
# See DEPLOYMENT_RUNBOOK.md for detailed steps
```

## 🔧 Key Configuration Files

| File | Purpose | Required |
|------|---------|----------|
| `.env` | Local development environment | Yes |
| `.env.staging` | Staging environment | Yes |
| `.env.production` | Production environment | Yes |
| `docker-compose.yml` | Docker development setup | Yes |
| `docker-compose.production.yml` | Docker production setup | Yes |
| `northflank.json` | NorthFlank deployment config | Yes |

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (Supabase)     │
│   Port: 5173    │    │   Port: 8000    │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Trading       │    │   Redis Cache   │
│   (Real-time)   │    │   Engines       │    │   (Sessions)    │
│   Port: 8000    │    │   FreqTrade     │    │   Port: 6379    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔍 Environment-Specific Setup

### Development Environment
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **Database**: Local Supabase instance
- **Features**: Debug mode enabled, mock data available

### Staging Environment
- **Frontend**: `https://staging.enterprise-crypto.com`
- **Backend API**: `https://staging-api.enterprise-crypto.com`
- **Database**: Staging Supabase project
- **Features**: Production-like, limited trading

### Production Environment
- **Frontend**: `https://app.enterprise-crypto.com`
- **Backend API**: `https://api.enterprise-crypto.com`
- **Database**: Production Supabase project
- **Features**: Full trading enabled, monitoring active

## 🛠️ Common Deployment Tasks

### Update Environment Variables
```bash
# 1. Update the appropriate .env file
nano .env.production

# 2. Restart services
docker-compose down
docker-compose up -d

# 3. Verify configuration
curl https://api.enterprise-crypto.com/health
```

### Database Migrations
```bash
# Run Supabase migrations
cd supabase
supabase db push

# Or via dashboard
# 1. Go to Supabase project
# 2. SQL Editor -> New query
# 3. Run migration SQL
```

### SSL Certificate Renewal
```bash
# For NorthFlank, certificates are managed automatically
# For self-hosted, use Let's Encrypt:
certbot --nginx -d yourdomain.com
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Metrics**: `GET /metrics` (Prometheus format)

### Key Metrics to Monitor
- API response times
- Database connection pool
- Trading engine status
- WebSocket connections
- Error rates
- Memory and CPU usage

### Alerting Setup
```bash
# Configure monitoring in .env.production
SENTRY_DSN=https://xxx@sentry.io/xxx
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
ENABLE_ERROR_REPORTING=true
```

## 🚨 Troubleshooting Quick Reference

### Common Issues
1. **Build Failures**: Check TypeScript errors, clear cache
2. **Database Issues**: Verify connection strings, check Supabase status
3. **API Errors**: Check environment variables, review logs
4. **Trading Issues**: Verify exchange API keys, check permissions

### Debug Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend

# Test API connectivity
curl -I https://api.enterprise-crypto.com/health

# Check environment variables
printenv | grep VITE_
```

## 📞 Support & Contacts

- **Documentation Issues**: Create GitHub issue
- **Deployment Problems**: Contact DevOps team
- **API Questions**: Check API reference first
- **Emergency**: Use rollback procedures

## 🔄 Maintenance Schedule

### Daily
- Monitor health checks
- Review error logs
- Check trading performance

### Weekly
- Update dependencies
- Review security patches
- Backup configurations

### Monthly
- Full system audit
- Performance optimization
- Documentation updates

## 📝 Documentation Maintenance

When updating the system:
1. Update environment variables in `ENVIRONMENT_VARIABLES.md`
2. Add new API endpoints to `API_REFERENCE.md`
3. Update deployment steps in `DEPLOYMENT_RUNBOOK.md`
4. Test all procedures after changes

## 🗂️ File Structure

```
docs/deployment/
├── README.md                    # This file
├── DEPLOYMENT_RUNBOOK.md        # Complete deployment guide
├── ENVIRONMENT_VARIABLES.md     # Configuration reference
└── API_REFERENCE.md             # API documentation
```

---

**Last Updated**: 2025-01-04  
**Version**: 1.0.0  
**Maintainer**: Enterprise Crypto Team
