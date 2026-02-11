import { test, expect } from '@playwright/test'

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Fill in credentials
    await page.getByPlaceholder('you@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 })

    // Navigate to chat
    await page.goto('/chat')
    await page.waitForLoadState('networkidle')
  })

  test('chat page loads and shows welcome message', async ({ page }) => {
    // Check welcome message is visible
    await expect(page.getByText(/Halo! Saya AI Builder SiteSpark/i)).toBeVisible({ timeout: 10000 })

    // Check input is present
    await expect(page.getByPlaceholder(/Describe the website you want/i)).toBeVisible()
  })

  test('sending a message shows user message', async ({ page }) => {
    // Wait for welcome message
    await expect(page.getByText(/Halo! Saya AI Builder SiteSpark/i)).toBeVisible({ timeout: 10000 })

    // Type a message
    const input = page.getByPlaceholder(/Describe the website you want/i)
    await input.fill('Buatkan website coffee shop')

    // Click send
    await page.getByRole('button', { type: 'submit' }).click()

    // Check user message appears
    await expect(page.getByText('Buatkan website coffee shop')).toBeVisible()
  })

  test('WebSocket connects and receives response', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleMessages.push(text)
      console.log('[Browser Console]:', text)
    })

    // Listen for WebSocket messages
    page.on('websocket', ws => {
      console.log('WebSocket connected:', ws.url())

      ws.on('framereceived', data => {
        console.log('WebSocket frame received:', data.payload)
      })

      ws.on('framesent', data => {
        console.log('WebSocket frame sent:', data.payload)
      })

      ws.on('close', () => {
        console.log('WebSocket closed')
      })
    })

    // Wait for welcome message
    await expect(page.getByText(/Halo! Saya AI Builder SiteSpark/i)).toBeVisible({ timeout: 10000 })

    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(2000)

    // Type and send a message
    const input = page.getByPlaceholder(/Describe the website you want/i)
    await input.fill('Test message')
    await page.getByRole('button', { type: 'submit' }).click()

    // Wait for response (up to 30 seconds)
    await page.waitForTimeout(5000)

    // Check console logs for socket activity
    const socketLogs = consoleMessages.filter(msg => msg.includes('[Socket]'))
    console.log('Socket logs:', socketLogs)

    // Take screenshot
    await page.screenshot({ path: 'test-results/chat-test.png' })
  })
})
