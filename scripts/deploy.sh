#!/bin/bash
# Unified Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Validate environment
[[ "$ENVIRONMENT" =~ ^(staging|production)$ ]] || error "Usage: $0 [staging|production]"

echo "
╔════════════════════════════════════════════════════╗
║       ENTERPRISE CRYPTO - DEPLOYMENT SCRIPT          ║
║       Environment: $ENVIRONMENT                        ║
╚════════════════════════════════════════════════════╝
"

cd "$PROJECT_ROOT"

# Pre-flight checks
log "Running pre-flight checks..."

command -v docker >/dev/null 2>&1 || error "Docker not installed"
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || error "Docker Compose not installed"

ENV_FILE=".env.${ENVIRONMENT}"
[[ -f "$ENV_FILE" ]] || error "$ENV_FILE not found. Copy from .env.${ENVIRONMENT}.example"

# Check critical env vars
for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  grep -q "^${var}=" "$ENV_FILE" || error "$var not set in $ENV_FILE"
done

# Verify PAPER_TRADING is true
grep -q "PAPER_TRADING=true" "$ENV_FILE" || {
  warn "PAPER_TRADING is not set to true!"
  [[ "$ENVIRONMENT" == "production" ]] && error "Production must have PAPER_TRADING=true initially"
}

success "Pre-flight checks passed"

# Run tests
log "Running tests..."
npm run test -- --run --silent || error "Tests failed!"
success "Tests passed"

# Build
log "Building application..."
npm run build || error "Build failed"
success "Build complete"

# Select compose file
COMPOSE_FILE="docker-compose.yml"
[[ "$ENVIRONMENT" == "staging" ]] && COMPOSE_FILE="docker-compose.staging.yml"

# Production confirmation
if [[ "$ENVIRONMENT" == "production" ]]; then
  warn "⚠️  PRODUCTION DEPLOYMENT ⚠️"
  read -p "Type 'deploy' to continue: " confirm
  [[ "$confirm" == "deploy" ]] || { log "Cancelled"; exit 0; }
fi

# Deploy
log "Deploying to $ENVIRONMENT..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker compose -f "$COMPOSE_FILE" build --no-cache
docker compose -f "$COMPOSE_FILE" up -d

# Health checks
log "Waiting for services (30s)..."
sleep 30

log "Running health checks..."
curl -sf http://localhost:8000/health > /dev/null || error "Backend health check failed"
success "Backend healthy"

# Show status
docker compose -f "$COMPOSE_FILE" ps

echo "
╔════════════════════════════════════════════════════╗
║              DEPLOYMENT COMPLETE ✓                 ║
╠════════════════════════════════════════════════════╣
║  Frontend: http://localhost:3000                   ║
║  Backend:  http://localhost:8000                   ║
║  API Docs: http://localhost:8000/docs              ║
╚════════════════════════════════════════════════════╝
"

[[ "$ENVIRONMENT" == "production" ]] && warn "Monitor closely for 24h before enabling live trading"

