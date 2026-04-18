import { test, expect } from '@playwright/test'
import { PERSONAS } from './globalSetup'

test.describe('Login', () => {
  test('successful login redirects to /dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', PERSONAS.sender.email)
    await page.fill('#password', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', PERSONAS.sender.email)
    await page.fill('#password', 'WrongPass999!')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"], [id$="-error"]').first()).toBeVisible()
  })

  test('"Se souvenir de moi" checkbox is present', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#rememberMe')).toBeVisible()
  })
})

test.describe('Logout', () => {
  test('logout clears session and redirects', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/login')
    await page.fill('#email', PERSONAS.sender.email)
    await page.fill('#password', 'TestPass123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Click logout button (text "Déconnexion" in DashboardLayout)
    await page.getByText('Déconnexion').first().click()
    await expect(page).toHaveURL(/\/(login|$)/)

    await context.close()
  })
})

test.describe('Registration', () => {
  test('shows confirmation message after submit', async ({ page }) => {
    const unique = `e2e-reg-${Date.now()}@sendbox-test.com`
    await page.goto('/register')
    await page.fill('#firstname', 'Test')
    await page.fill('#lastname', 'User')
    await page.fill('#email', unique)
    await page.fill('#password', 'TestPass123!')
    await page.fill('#confirmPassword', 'TestPass123!')
    await page.locator('#terms').check()
    await page.click('button[type="submit"]')
    // Expect either a success message or email verification page
    await expect(
      page.getByText(/vérification|confirmez|email|check/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('duplicate email shows error', async ({ page }) => {
    await page.goto('/register')
    await page.fill('#firstname', 'Test')
    await page.fill('#lastname', 'User')
    await page.fill('#email', PERSONAS.sender.email)
    await page.fill('#password', 'TestPass123!')
    await page.fill('#confirmPassword', 'TestPass123!')
    await page.locator('#terms').check()
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"], [id$="-error"]').first()).toBeVisible()
  })

  test('terms checkbox required', async ({ page }) => {
    await page.goto('/register')
    await page.fill('#firstname', 'Test')
    await page.fill('#lastname', 'User')
    await page.fill('#email', `e2e-terms-${Date.now()}@sendbox-test.com`)
    await page.fill('#password', 'TestPass123!')
    await page.fill('#confirmPassword', 'TestPass123!')
    // Do NOT check terms
    await page.click('button[type="submit"]')
    await expect(page.locator('#terms-error')).toBeVisible()
  })
})

test.describe('Reset Password', () => {
  test('shows success message regardless of email existence', async ({ page }) => {
    await page.goto('/reset-password')
    await page.fill('#email', 'anyone@example.com')
    await page.click('button[type="submit"]')
    await expect(
      page.getByText(/email|envoyé|sent|vérifi/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
