import { test, expect } from '@playwright/test'

test.describe('Login Debug Tests', () => {
  test('capture all console logs and network requests during login', async ({ page }) => {
    const consoleLogs: string[] = []
    const networkRequests: string[] = []
    const networkErrors: string[] = []

    // Capture console logs
    page.on('console', (msg) => {
      const log = `[${msg.type()}] ${msg.text()}`
      consoleLogs.push(log)
      console.log('Console:', log)
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      console.log('Page Error:', error.message)
    })

    // Capture network requests
    page.on('request', (request) => {
      const req = `${request.method()} ${request.url()}`
      networkRequests.push(req)
      console.log('Request:', req)
    })

    // Capture network responses
    page.on('response', (response) => {
      const resp = `${response.status()} ${response.url()}`
      console.log('Response:', resp)
    })

    // Capture network failures
    page.on('requestfailed', (request) => {
      const error = `FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`
      networkErrors.push(error)
      console.log('Request Failed:', error)
    })

    // Navigate to login
    console.log('=== Navigating to login page ===')
    await page.goto('/login')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    console.log('=== Current URL:', page.url())
    console.log('=== Console logs so far:', consoleLogs)
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/login-page.png' })

    // Fill in login form
    console.log('=== Filling login form ===')
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/password/i)
    
    await emailInput.fill('test@test.com')
    await passwordInput.fill('password123')
    
    // Click sign in
    console.log('=== Clicking sign in ===')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Wait a bit for any navigation or errors
    await page.waitForTimeout(3000)
    
    // Capture final state
    console.log('=== Final URL:', page.url())
    console.log('=== All console logs:', consoleLogs)
    console.log('=== All network requests:', networkRequests)
    console.log('=== Network errors:', networkErrors)
    
    // Take screenshot of result
    await page.screenshot({ path: 'test-results/login-result.png', fullPage: true })
    
    // Check if we navigated to dashboard
    const currentUrl = page.url()
    if (currentUrl.includes('dashboard')) {
      console.log('✓ SUCCESS: Navigated to dashboard')
    } else if (currentUrl.includes('login')) {
      console.log('✗ FAILED: Still on login page')
      
      // Check for error messages
      const errorText = await page.locator('text=/invalid|error|failed/i').textContent().catch(() => null)
      console.log('Error message:', errorText)
    }
    
    // Assertions
    expect(networkErrors).toHaveLength(0)
    expect(consoleLogs.some(log => log.includes('Login successful'))).toBeTruthy()
  })

  test('test API connectivity directly', async ({ page }) => {
    // Test health endpoint
    const healthResponse = await page.evaluate(async () => {
      try {
        const resp = await fetch('http://localhost:3001/health')
        return { status: resp.status, body: await resp.json() }
      } catch (e: any) {
        return { error: e.message }
      }
    })
    
    console.log('Health check response:', healthResponse)
    expect(healthResponse.status).toBe(200)
    
    // Test login API directly
    const loginResponse = await page.evaluate(async () => {
      try {
        const resp = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' })
        })
        return { status: resp.status, body: await resp.json() }
      } catch (e: any) {
        return { error: e.message }
      }
    })
    
    console.log('Login API response:', loginResponse)
    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.success).toBe(true)
    expect(loginResponse.body.data.accessToken).toBeDefined()
  })

  test('check localStorage after login', async ({ page }) => {
    await page.goto('/login')
    
    // Fill and submit login
    await page.getByPlaceholder(/email/i).fill('test@test.com')
    await page.getByPlaceholder(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Wait for navigation or error
    await page.waitForTimeout(3000)
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      const data: Record<string, string | null> = {}
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key) {
          data[key] = window.localStorage.getItem(key)
        }
      }
      return data
    })
    
    console.log('localStorage contents:', localStorage)
    
    // Check if token was stored
    expect(localStorage.token || localStorage['auth-storage']).toBeDefined()
  })
})
