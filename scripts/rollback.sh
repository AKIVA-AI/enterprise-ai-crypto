#!/bin/bash
# Rollback Script — Enterprise Crypto
# Usage: ./scripts/rollback.sh <previous-image-tag> [staging|production]
#
# Rolls back the Docker deployment to a previous image tag after
# validating that the target image exists and the health check passes.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PREVIOUS_TAG=${1:?Usage: $0 <previous-image-tag> [staging|production]}
ENVIRONMENT=${2:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="enterprise-crypto-backend"
HEALTH_URL="http://localhost:8000/health"
MAX_RETRIES=10
RETRY_INTERVAL=5

log()     { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Validate environment
[[ "$ENVIRONMENT" =~ ^(staging|production)$ ]] || error "Environment must be 'staging' or 'production'"

echo "
+====================================================+
|       ENTERPRISE CRYPTO - ROLLBACK                  |
|       Target tag : $PREVIOUS_TAG
|       Environment: $ENVIRONMENT
+====================================================+
"

cd "$PROJECT_ROOT"

# 1. Verify the target image exists locally
log "Checking for image ${IMAGE_NAME}:${PREVIOUS_TAG}..."
if ! docker image inspect "${IMAGE_NAME}:${PREVIOUS_TAG}" > /dev/null 2>&1; then
    error "Image ${IMAGE_NAME}:${PREVIOUS_TAG} not found locally. Cannot rollback."
fi
success "Image found"

# 2. Select compose file
COMPOSE_FILE="docker-compose.yml"
[[ "$ENVIRONMENT" == "staging" ]] && COMPOSE_FILE="docker-compose.staging.yml"

# 3. Production confirmation
if [[ "$ENVIRONMENT" == "production" ]]; then
    warn "PRODUCTION ROLLBACK"
    read -p "Type 'rollback' to continue: " confirm
    [[ "$confirm" == "rollback" ]] || { log "Cancelled"; exit 0; }
fi

# 4. Tag the rollback image as 'latest' so compose picks it up
log "Tagging ${IMAGE_NAME}:${PREVIOUS_TAG} as ${IMAGE_NAME}:latest..."
docker tag "${IMAGE_NAME}:${PREVIOUS_TAG}" "${IMAGE_NAME}:latest"
success "Image tagged"

# 5. Stop current containers and start with rolled-back image
log "Rolling back to ${PREVIOUS_TAG}..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker compose -f "$COMPOSE_FILE" up -d

# 6. Wait for health check
log "Waiting for health check (max ${MAX_RETRIES} attempts, ${RETRY_INTERVAL}s interval)..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
        success "Health check passed on attempt $i"
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        error "Health check failed after $MAX_RETRIES attempts. Manual intervention required."
    fi
    log "Attempt $i/$MAX_RETRIES — retrying in ${RETRY_INTERVAL}s..."
    sleep $RETRY_INTERVAL
done

# 7. Show running containers
docker compose -f "$COMPOSE_FILE" ps

echo "
+====================================================+
|              ROLLBACK COMPLETE                      |
|  Rolled back to: ${PREVIOUS_TAG}
|  Environment:    ${ENVIRONMENT}
|  Health:         PASSING
+====================================================+
"

success "Rollback to ${PREVIOUS_TAG} successful."
