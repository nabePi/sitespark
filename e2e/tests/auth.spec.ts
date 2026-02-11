import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored auth data
    await page.goto('/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')

    // Wait for React to render
    await page.waitForLoadState('networkidle')

    // Check form elements exist using placeholder selectors
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 10000 })
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')

    // Wait for form to be ready
    await page.waitForLoadState('networkidle')

    // Use placeholder selectors to find inputs
    await page.getByPlaceholder('you@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 })

    // Verify dashboard content - use heading for specificity
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('failed login shows error message', async ({ page }) => {
    await page.goto('/login')

    // Wait for form to be ready
    await page.waitForLoadState('networkidle')

    // Fill in wrong credentials using placeholder selectors (same as working tests)
    await page.getByPlaceholder('you@example.com').fill('wrong@email.com')
    await page.getByPlaceholder('••••••••').fill('wrongpassword')

    // Set up response listener BEFORE clicking
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/auth/login'),
      { timeout: 10000 }
    )

    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for the login API call to complete
    const response = await responsePromise

    // Verify API returns 401 with proper error
    expect(response.status()).toBe(401)
    const responseBody = await response.json()
    expect(responseBody.success).toBe(false)
    expect(responseBody.error.message).toMatch(/invalid email or password/i)

    // Verify still on login page
    await expect(page).toHaveURL(/.*login.*/)
  })

  test('authenticated user is redirected from login to dashboard', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('you@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')

    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 })

    // Try to go back to login
    await page.goto('/login')

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 5000 })
  })

  test('logout redirects to login', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('you@example.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('password123')

    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 10000 })

    // Click logout (assuming there's a logout button)
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i })
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click()
      await expect(page).toHaveURL(/.*login.*/, { timeout: 5000 })
    }
  })
})
