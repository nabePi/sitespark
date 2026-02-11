#!/bin/bash

# WebSocket Test Runner Script
# Usage: ./run-websocket-tests.sh [unit|integration|all|manual]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/apps/backend-go"
FRONTEND_DIR="$SCRIPT_DIR/apps/frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}================================${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

run_unit_tests() {
    print_header "Running WebSocket Unit Tests"
    cd "$BACKEND_DIR"

    echo "Testing WebSocket Manager..."
    go test ./internal/websocket/... -v -run "Test[^Integration]"

    echo ""
    echo "Testing WebSocket Handler..."
    go test ./internal/handlers/... -v -run "WebSocket"

    echo ""
    echo "Running with race detector..."
    go test ./internal/websocket/... -race -run "Test[^Integration]"

    echo ""
    echo "Generating coverage report..."
    go test -coverprofile=coverage.out ./internal/websocket/...
    go tool cover -func=coverage.out
}

run_integration_tests() {
    print_header "Running WebSocket Integration Tests"
    cd "$BACKEND_DIR"

    # Check if server is running
    if ! curl -s http://localhost:3001/health > /dev/null; then
        print_warning "Backend server not running at localhost:3001"
        print_warning "Starting server for integration tests..."

        # Start server in background
        go run cmd/api/main.go &
        SERVER_PID=$!

        # Wait for server to start
        sleep 5

        # Check if server started
        if ! curl -s http://localhost:3001/health > /dev/null; then
            print_error "Failed to start backend server"
            exit 1
        fi

        STOP_SERVER=true
    fi

    echo "Running integration tests..."
    go test -tags=integration ./internal/websocket/... -v

    if [ "$STOP_SERVER" = true ]; then
        echo "Stopping test server..."
        kill $SERVER_PID 2>/dev/null || true
    fi
}

run_frontend_tests() {
    print_header "Running Frontend WebSocket Tests"
    cd "$FRONTEND_DIR"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "Installing frontend dependencies..."
        npm install
    fi

    echo "Running TypeScript type check..."
    npx tsc --noEmit

    echo ""
    echo "Running lint..."
    npm run lint

    echo ""
    echo "Frontend tests complete!"
}

run_manual_test_guide() {
    print_header "WebSocket Manual Test Guide"

    cat <<EOF

Manual Testing Steps:
=====================

1. Prerequisites:
   - Backend server running: cd apps/backend-go && go run cmd/api/main.go
   - Frontend running: cd apps/frontend && npm run dev
   - wscat installed: npm install -g wscat

2. Get JWT Token:
   curl -X POST http://localhost:3001/api/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{"name":"Test","email":"test@test.com","password":"password123"}'

   Or login:
   curl -X POST http://localhost:3001/api/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email":"test@test.com","password":"password123"}'

3. Test WebSocket Connection:
   TOKEN="your-jwt-token"
   wscat -c "ws://localhost:3001/ws?token=$TOKEN"

4. Test Messages:
   # Send chat message
   > {"type":"chat:message","content":"Hello AI"}

   # Send typing indicator
   > {"type":"chat:typing","isTyping":true}

   # Join website room
   > {"type":"website:join","websiteId":"valid-uuid"}

   # Leave website room
   > {"type":"website:leave","websiteId":"valid-uuid"}

5. Expected Responses:
   - connected: {"type":"connected","id":"...","userId":"..."}
   - chat acknowledgment: {"type":"chat:message","role":"user",...}
   - stream chunks: {"type":"chat:stream","chunk":"..."}
   - final response: {"type":"chat:message","role":"assistant",...}
   - typing: {"type":"chat:typing","userId":"...","isTyping":true}
   - errors: {"type":"error","error":"..."}

6. Test Error Cases:
   # No token
   wscat -c "ws://localhost:3001/ws"

   # Invalid token
   wscat -c "ws://localhost:3001/ws?token=invalid"

   # Invalid JSON
   > not valid json

   # Unknown message type
   > {"type":"unknown:type"}

See WEBSOCKET_TEST_PLAN.md for comprehensive test scenarios.

EOF
}

run_all_tests() {
    run_unit_tests
    echo ""
    run_integration_tests
    echo ""
    run_frontend_tests
    echo ""
    print_header "All Tests Complete!"
}

# Main
TEST_TYPE="${1:-all}"

case "$TEST_TYPE" in
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    frontend)
        run_frontend_tests
        ;;
    manual)
        run_manual_test_guide
        ;;
    all)
        run_all_tests
        ;;
    *)
        echo "Usage: $0 [unit|integration|frontend|manual|all]"
        echo ""
        echo "Options:"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  frontend    - Run frontend type check and lint"
        echo "  manual      - Show manual testing guide"
        echo "  all         - Run all tests (default)"
        exit 1
        ;;
esac
