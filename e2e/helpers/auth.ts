/**
 * Helpers pour l'authentification dans les tests E2E
 */

import { Page, expect } from '@playwright/test'

/**
 * Connecte un utilisateur avec email et mot de passe
 */
export async function loginAsUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard', { timeout: 10000 })
  await expect(page).toHaveURL('/dashboard')
}

/**
 * Connecte un administrateur
 */
export async function loginAsAdmin(page: Page) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sendbox.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  await loginAsUser(page, adminEmail, adminPassword)
}

/**
 * Déconnecte l'utilisateur actuel
 */
export async function logout(page: Page) {
  // Chercher le bouton de déconnexion dans le header
  await page.click('button:has-text("Déconnexion")', { timeout: 5000 }).catch(() => {
    // Si le bouton n'existe pas, essayer de naviguer vers /logout
    return page.goto('/logout')
  })
  await page.waitForURL('/login')
}

/**
 * Crée un nouvel utilisateur de test
 */
export async function createTestUser(
  page: Page,
  email: string,
  password: string,
  firstname: string = 'Test',
  lastname: string = 'User'
) {
  await page.goto('/register')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.fill('[name="confirmPassword"]', password)
  await page.fill('[name="firstname"]', firstname)
  await page.fill('[name="lastname"]', lastname)
  await page.fill('[name="phone"]', '+33612345678')
  await page.check('[name="terms"]')
  await page.click('button[type="submit"]')
  
  // Attendre la redirection ou le message de succès
  await page.waitForTimeout(2000)
}

/**
 * Vérifie qu'un utilisateur est connecté
 */
export async function expectUserLoggedIn(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/)
  // Vérifier la présence d'éléments du dashboard
  await expect(page.locator('text=Dashboard').or(page.locator('h1'))).toBeVisible()
}

/**
 * Vérifie qu'un utilisateur n'est pas connecté
 */
export async function expectUserLoggedOut(page: Page) {
  await expect(page).toHaveURL(/\/login|\//)
}









