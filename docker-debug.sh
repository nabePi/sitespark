#!/bin/bash

# Docker Debug Script for SiteSpark

set -e

echo "=== SiteSpark Docker Diagnostic Tool ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print colored output
print_error() { echo -e "${RED}ERROR: $1${NC}"; }
print_success() { echo -e "${GREEN}SUCCESS: $1${NC}"; }
print_info() { echo -e "${YELLOW}INFO: $1${NC}"; }

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_success "Docker is running"

# Show container status
echo ""
echo "=== Container Status ==="
docker-compose ps

# Check backend logs
echo ""
echo "=== Backend Logs (last 50 lines) ==="
docker-compose logs --tail=50 backend 2>/dev/null || print_error "Backend container not found"

# Check if backend is restarting
echo ""
echo "=== Backend Restart Count ==="
RESTART_COUNT=$(docker inspect -f '{{ .RestartCount }}' sitespark-backend 2>/dev/null || echo "N/A")
if [ "$RESTART_COUNT" != "N/A" ]; then
    if [ "$RESTART_COUNT" -gt 0 ]; then
        print_error "Backend has restarted $RESTART_COUNT times"
    else
        print_success "Backend has not restarted"
    fi
fi

# Check database connectivity from backend container
echo ""
echo "=== Testing Database Connectivity ==="
if docker exec sitespark-backend pg_isready -h postgres -U sitespark > /dev/null 2>&1; then
    print_success "Can connect to PostgreSQL"
else
    print_error "Cannot connect to PostgreSQL"
fi

# Check Redis connectivity
echo ""
echo "=== Testing Redis Connectivity ==="
if docker exec sitespark-backend redis-cli -h redis ping > /dev/null 2>&1; then
    print_success "Can connect to Redis"
else
    print_error "Cannot connect to Redis"
fi

# Check if port is listening
echo ""
echo "=== Checking Backend Port ==="
if docker exec sitespark-backend wget -qO- http://localhost:3001/health > /dev/null 2>&1; then
    print_success "Backend health endpoint is responding"
else
    print_error "Backend health endpoint is not responding"
fi

# Show resource usage
echo ""
echo "=== Resource Usage ==="
docker stats --no-stream sitespark-backend sitespark-postgres sitespark-redis 2>/dev/null || true

echo ""
echo "=== Diagnostic Complete ==="
echo ""
echo "Common fixes:"
echo "1. Rebuild containers: docker-compose down -v && docker-compose up -d --build"
echo "2. Check logs: docker-compose logs -f backend"
echo "3. Restart single service: docker-compose restart backend"
echo "4. Check env vars: docker exec sitespark-backend env | grep -E 'DB_|REDIS_'"
