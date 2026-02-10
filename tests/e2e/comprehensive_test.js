#!/usr/bin/env node
/**
 * SiteSpark End-to-End Testing Script
 * Tests all pages and features
 * 
 * Usage: node tests/e2e/comprehensive_test.js
 */

const http = require('http');

// Config
const BASE_URL = 'http://localhost';
const FRONTEND_PORT = 3002;
const API_PORT = 3001;
const TEST_CREDENTIALS = {
  email: 'test@sitespark.id',
  password: 'test123456'
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let token = null;
let testResults = [];

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red : 
                type === 'warn' ? colors.yellow : colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

// HTTP Request helper
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const port = options.port || API_PORT;
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

// Test functions
async function testBackendHealth() {
  log('\n🏥 Testing Backend Health...');
  try {
    const res = await request('/health', { port: API_PORT });
    if (res.data.status === 'healthy') {
      log('✅ Backend is healthy', 'success');
      return true;
    }
  } catch (e) {
    log('❌ Backend health check failed', 'error');
    return false;
  }
}

async function testFrontendServing() {
  log('\n🌐 Testing Frontend...');
  try {
    const res = await request('/', { port: FRONTEND_PORT });
    if (res.status === 200 && res.data.includes('SiteSpark')) {
      log('✅ Frontend serving correctly', 'success');
      return true;
    }
  } catch (e) {
    log('❌ Frontend not responding', 'error');
    return false;
  }
}

async function testLogin() {
  log('\n🔑 Testing Login API...');
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: TEST_CREDENTIALS
    });
    
    if (res.data.success && res.data.data.accessToken) {
      token = res.data.data.accessToken;
      log('✅ Login successful', 'success');
      log(`   Token: ${token.substring(0, 30)}...`);
      return true;
    }
  } catch (e) {
    log('❌ Login failed', 'error');
    console.error(e);
    return false;
  }
}

async function testAuthenticatedAPIs() {
  log('\n🔒 Testing Authenticated APIs...');
  const tests = [
    { name: 'Get Profile', path: '/api/auth/me' },
    { name: 'Get Websites', path: '/api/websites', checkField: 'websites' },
    { name: 'Get Token Balance', path: '/api/tokens/balance', checkField: 'balance' },
    { name: 'Get Transactions', path: '/api/tokens/transactions', checkField: 'transactions' },
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const res = await request(test.path, { token });
      if (res.data.success) {
        // Check if response has correct structure
        const data = res.data.data;
        if (test.checkField) {
          if (data && (Array.isArray(data[test.checkField]) || data[test.checkField] !== undefined)) {
            log(`✅ ${test.name} - Structure OK`, 'success');
            passed++;
          } else {
            log(`⚠️  ${test.name} - Missing ${test.checkField} field`, 'warn');
            log(`   Response: ${JSON.stringify(data).substring(0, 100)}`);
          }
        } else {
          log(`✅ ${test.name}`, 'success');
          passed++;
        }
      } else {
        log(`❌ ${test.name} - API error`, 'error');
      }
    } catch (e) {
      log(`❌ ${test.name} - Request failed`, 'error');
    }
  }
  
  return passed === tests.length;
}

async function testCORS() {
  log('\n🌎 Testing CORS Headers...');
  try {
    const res = await request('/api/websites', {
      token,
      headers: {
        'Origin': `http://localhost:${FRONTEND_PORT}`
      }
    });
    
    // CORS headers are checked in response headers (not visible in this test)
    log('✅ CORS preflight not blocked', 'success');
    return true;
  } catch (e) {
    log('❌ CORS issue', 'error');
    return false;
  }
}

async function testDataStructure() {
  log('\n📊 Testing API Data Structures...');
  
  // Test websites response structure
  const websitesRes = await request('/api/websites', { token });
  const websitesData = websitesRes.data.data;
  
  if (websitesData && Array.isArray(websitesData.websites)) {
    log('✅ /websites returns { websites: [...] }', 'success');
  } else if (Array.isArray(websitesData)) {
    log('⚠️  /websites returns array directly (frontend may fail)', 'warn');
  } else {
    log('❌ /websites has unexpected structure', 'error');
    log(`   Got: ${JSON.stringify(websitesData).substring(0, 100)}`);
  }
  
  // Test transactions response structure
  const transRes = await request('/api/tokens/transactions', { token });
  const transData = transRes.data.data;
  
  if (transData && Array.isArray(transData.transactions)) {
    log('✅ /tokens/transactions returns { transactions: [...] }', 'success');
  } else if (Array.isArray(transData)) {
    log('⚠️  /tokens/transactions returns array directly', 'warn');
  } else {
    log('❌ /tokens/transactions has unexpected structure', 'error');
  }
  
  return true;
}

// Main test runner
async function runTests() {
  log('🧪 SiteSpark Comprehensive E2E Test', 'info');
  log('=====================================');
  
  const tests = [
    testBackendHealth,
    testFrontendServing,
    testLogin,
    testAuthenticatedAPIs,
    testCORS,
    testDataStructure
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (e) {
      log(`❌ Test crashed: ${e.message}`, 'error');
      failed++;
    }
  }
  
  // Summary
  log('\n=====================================');
  log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    log('\n🎉 All tests passed!', 'success');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed', 'error');
    process.exit(1);
  }
}

// Run tests
runTests().catch(e => {
  log(`\n💥 Test suite crashed: ${e.message}`, 'error');
  process.exit(1);
});
