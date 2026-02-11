#!/bin/bash

set -e

echo "=== SiteSpark Rebuild & Test Script ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Stopping containers...${NC}"
docker-compose down

echo -e "${YELLOW}Step 2: Removing old images...${NC}"
docker rmi sitespark-frontend sitespark-backend 2>/dev/null || true

echo -e "${YELLOW}Step 3: Building new images...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}Step 4: Starting containers...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 5: Waiting for services to be ready...${NC}"
sleep 10

# Check health
echo ""
echo "=== Service Health Check ==="
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    docker-compose logs backend
fi

if curl -s http://localhost:3002/health | grep -q "healthy"; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Frontend: http://localhost:3002"
echo "Backend:  http://localhost:3001"
echo ""
echo "Test credentials:"
echo "  Email: test@test.com"
echo "  Password: password123"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f backend"
echo "  docker-compose logs -f frontend"
echo ""
echo "To run browser tests:"
echo "  cd e2e && ./run-tests.sh"
