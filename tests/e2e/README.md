# SiteSpark E2E Testing Guide

## 🎯 Purpose
Prevent bugs like:
- API response structure mismatch
- Token handling errors
- Dashboard rendering issues
- JavaScript runtime errors

## 🛠️ Setup

```bash
# Install Playwright dependencies
cd /home/ubuntu/.openclaw/workspace/sitespark
npm install -D @playwright/test
npx playwright install chromium

# Run tests
python3 tests/e2e/test_login.py
```

## 🧪 Test Scenarios

### 1. Login Flow
- Navigate to login page
- Fill credentials
- Submit form
- Verify redirect to dashboard
- Check token stored in localStorage

### 2. Dashboard Load
- Verify welcome message
- Check stats cards render
- Verify no console errors
- Check API calls succeed

### 3. Website Creation (Future)
- Navigate to chat page
- Send AI prompt
- Verify website created
- Check website appears in list

### 4. Deployment (Future)
- Click deploy button
- Verify subdomain generated
- Check website live status

## 🚨 CI/CD Integration

```bash
# Pre-commit hook
#!/bin/bash
npm run build
cd tests/e2e && python3 test_login.py
```

## 📝 Testing Checklist

Before every deployment, run:
- [ ] Login works
- [ ] Dashboard loads without errors
- [ ] API responses match frontend types
- [ ] No console errors
- [ ] Responsive design works

## 🐛 Debug Failed Tests

```bash
# View screenshot
open /tmp/sitespark_error.png

# Check logs
npm run dev &
npx playwright test --headed
```
