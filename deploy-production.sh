#!/bin/bash

# ==========================================
# Production Deployment Script
# ==========================================
# This script deploys the Enterprise Crypto platform to production
# 
# Usage:
#   ./deploy-production.sh [environment]
#
# Environments:
#   staging    - Deploy to staging environment
#   production - Deploy to production environment
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - .env.production file configured
#   - Git repository up to date
#   - All tests passing
# ==========================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="enterprise-crypto"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Usage: ./deploy-production.sh [staging|production]"
    exit 1
fi

log_info "Starting deployment to $ENVIRONMENT..."

# Step 1: Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if .env file exists
if [[ ! -f ".env.$ENVIRONMENT" ]]; then
    log_error ".env.$ENVIRONMENT file not found!"
    log_info "Copy .env.production.example to .env.$ENVIRONMENT and configure it"
    exit 1
fi

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    log_warning "Git working directory is not clean"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 2: Run tests
log_info "Running tests..."
npm run test:unit || {
    log_error "Unit tests failed!"
    exit 1
}
log_success "Tests passed!"

# Step 3: Build frontend
log_info "Building frontend..."
npm run build || {
    log_error "Frontend build failed!"
    exit 1
}
log_success "Frontend built successfully!"

# Step 4: Build Docker images
log_info "Building Docker images..."
docker-compose -f docker-compose.yml build || {
    log_error "Docker build failed!"
    exit 1
}
log_success "Docker images built!"

# Step 5: Deploy
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_warning "⚠️  DEPLOYING TO PRODUCTION ⚠️"
    log_warning "This will affect live users!"
    read -p "Are you sure? Type 'yes' to continue: " -r
    echo
    if [[ $REPLY != "yes" ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

log_info "Deploying to $ENVIRONMENT..."

# Load environment variables
export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d || {
    log_error "Deployment failed!"
    exit 1
}

log_success "Deployment successful!"

# Step 6: Health checks
log_info "Running health checks..."
sleep 10  # Wait for services to start

# Check backend health
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    log_success "Backend is healthy!"
else
    log_error "Backend health check failed!"
    log_info "Check logs: docker-compose logs api"
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend is healthy!"
else
    log_error "Frontend health check failed!"
    log_info "Check logs: docker-compose logs frontend"
    exit 1
fi

# Step 7: Post-deployment
log_info "Post-deployment tasks..."

# Show running containers
log_info "Running containers:"
docker-compose ps

# Show logs
log_info "Recent logs:"
docker-compose logs --tail=20

log_success "🎉 Deployment to $ENVIRONMENT complete!"
log_info "Frontend: http://localhost:3000"
log_info "Backend: http://localhost:8000"
log_info "API Docs: http://localhost:8000/docs"

# Monitoring reminders
log_warning "⚠️  IMPORTANT POST-DEPLOYMENT TASKS:"
echo "1. Monitor error logs for 30 minutes"
echo "2. Check Sentry for errors"
echo "3. Verify kill switch is working"
echo "4. Test critical user flows"
echo "5. Monitor system metrics"

if [[ "$ENVIRONMENT" == "production" ]]; then
    log_warning "🚨 PRODUCTION DEPLOYMENT CHECKLIST:"
    echo "1. Verify PAPER_TRADING=true"
    echo "2. Check position limits are set"
    echo "3. Verify monitoring alerts are active"
    echo "4. Have rollback plan ready"
    echo "5. Monitor for 24 hours before enabling live trading"
fi

