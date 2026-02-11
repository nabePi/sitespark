# Login Issue Debugging Guide

## Common Causes

The login page refreshing without redirecting is usually caused by:

1. **CORS errors** - Backend not accepting requests from frontend
2. **API URL mismatch** - Frontend calling wrong backend URL
3. **Network errors** - Backend not accessible
4. **JavaScript errors** - Code crashing before redirect

## Quick Fixes

### 1. Rebuild Everything

```bash
# Stop and clean everything
docker-compose down -v

# Remove old images
docker rmi sitespark-frontend sitespark-backend

# Rebuild with new config
docker-compose up -d --build

# Check logs
docker-compose logs -f backend frontend
```

### 2. Check Browser Console

Open browser DevTools (F12) → Console tab, then try to login. Look for:

- **CORS errors**: `Access-Control-Allow-Origin` missing
- **Network errors**: `Failed to fetch` or `ERR_CONNECTION_REFUSED`
- **JavaScript errors**: Any red error messages

### 3. Test API Directly

```bash
# Test backend is running
curl http://localhost:3001/health

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

## Browser Diagnostic Script

Open browser console (F12) on the login page and run:

```javascript
// Test API connectivity
async function testLogin() {
  console.log('Testing API connection...');

  // Test health endpoint
  try {
    const health = await fetch('http://localhost:3001/health');
    console.log('✓ Backend is reachable:', await health.json());
  } catch (e) {
    console.error('✗ Cannot reach backend:', e.message);
    return;
  }

  // Test login with debug
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers]);

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✓ Login would succeed!');
    } else {
      console.error('✗ Login failed:', data);
    }
  } catch (e) {
    console.error('✗ Request failed:', e.message);
  }
}

testLogin();
```

## What to Check in Logs

### Backend Logs
```bash
docker-compose logs backend | grep -E "(error|Error|login|auth)"
```

Look for:
- Database connection errors
- CORS-related messages
- Authentication handler errors

### Frontend Logs
```bash
docker-compose logs frontend
```

## Configuration Changes Made

1. **api.ts**: Changed hardcoded URL to use env var
2. **Dockerfile**: Added build args for API URL
3. **docker-compose.yml**:
   - Added `VITE_API_URL` build arg
   - Changed `CORS_ORIGIN` to `"*"` (allow all)
4. **LoginForm.tsx**: Added better error logging

## If Still Not Working

1. Check if ports are available:
   ```bash
   lsof -i :3001  # Backend port
   lsof -i :3002  # Frontend port
   ```

2. Check backend is healthy:
   ```bash
   curl http://localhost:3001/health
   ```

3. Check frontend can reach backend from container:
   ```bash
   docker exec sitespark-frontend wget -qO- http://sitespark-backend:3001/health
   ```

4. Try using the frontend dev server instead:
   ```bash
   # Terminal 1 - Start backend only
   docker-compose up -d postgres redis backend

   # Terminal 2 - Start frontend dev server
   cd apps/frontend
   npm install
   npm run dev
   ```

## Expected Behavior After Fix

1. User enters email/password on login form
2. Frontend makes POST request to `http://localhost:3001/api/auth/login`
3. Backend validates and returns token
4. Frontend stores token and redirects to `/dashboard`

## Still Having Issues?

Run the diagnostic script and share the output:
```bash
./docker-debug.sh
```
