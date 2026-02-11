#!/bin/bash

set -e

echo "=== SiteSpark E2E Test Runner ==="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install Playwright browsers if not installed
if [ ! -d "$HOME/Library/Caches/ms-playwright" ] && [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium firefox
fi

# Check if docker containers are running
echo "Checking Docker containers..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "Starting Docker containers..."
    cd .. && docker-compose up -d && cd e2e
    sleep 5
fi

# Create test results directory
mkdir -p test-results

echo ""
echo "=== Running tests ==="
npx playwright test "$@"

echo ""
echo "=== Test complete ==="
echo "View report: npx playwright show-report"
