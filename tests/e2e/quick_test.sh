#!/bin/bash
# Quick E2E test script for SiteSpark
# Run this before every deployment

set -e

echo "🧪 SiteSpark Quick E2E Test"
echo "============================"

# Test 1: Backend Health
echo -e "\n1️⃣  Backend Health Check..."
if curl -s http://localhost:3001/health | grep -q '"status":"healthy"'; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
    exit 1
fi

# Test 2: Frontend Build
echo -e "\n2️⃣  Frontend Build Check..."
if curl -s http://localhost:3002 | grep -q "SiteSpark"; then
    echo "✅ Frontend is serving"
else
    echo "❌ Frontend is not responding"
    exit 1
fi

# Test 3: Login API
echo -e "\n3️⃣  Login API Test..."
LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@sitespark.id","password":"test123456"}')

if echo "$LOGIN" | grep -q '"success":true'; then
    echo "✅ Login API works"
else
    echo "❌ Login API failed"
    echo "$LOGIN"
    exit 1
fi

# Extract token
TOKEN=$(echo "$LOGIN" | jq -r '.data.accessToken')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Token not found in response"
    exit 1
fi
echo "✅ Token received: ${TOKEN:0:30}..."

# Test 4: Authenticated API Call
echo -e "\n4️⃣  Authenticated API Test..."
WEBSITES=$(curl -s http://localhost:3001/api/websites \
    -H "Authorization: Bearer $TOKEN")

if echo "$WEBSITES" | grep -q '"success":true'; then
    echo "✅ Authenticated API works"
else
    echo "❌ Authenticated API failed"
    echo "$WEBSITES"
    exit 1
fi

# Test 5: CORS Headers
echo -e "\n5️⃣  CORS Headers Check..."
CORS=$(curl -s -I http://localhost:3001/api/websites \
    -H "Origin: http://localhost:3002" \
    -H "Authorization: Bearer $TOKEN" | grep -i "access-control")

if echo "$CORS" | grep -q "Access-Control"; then
    echo "✅ CORS headers present"
else
    echo "❌ CORS headers missing"
    exit 1
fi

echo -e "\n🎉 All quick tests passed!"
echo "============================"
echo ""
echo "For full E2E testing, run:"
echo "  python3 tests/e2e/test_login.py"
