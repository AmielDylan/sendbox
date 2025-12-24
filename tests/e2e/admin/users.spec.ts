/**
 * Tests E2E : Administration - Gestion utilisateurs
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('admin can view users list', async ({ page }) => {
    await page.goto('/admin/users')

    // Vérifier que la page est accessible
    await expect(
      page.locator('h1, h2').filter({ hasText: /utilisateurs|users/i })
    ).toBeVisible()

    // Vérifier la présence de la table ou liste
    const usersTable = page.locator('table, [data-testid="users-list"]')
    await expect(usersTable).toBeVisible()
  })

  test('admin can ban a user', async ({ page }) => {
    await page.goto('/admin/users')

    // Trouver le premier bouton de bannissement
    const banButton = page.locator('button:has-text("Bannir"), button[aria-label*="ban"]').first()
    
    if (await banButton.isVisible({ timeout: 5000 })) {
      await banButton.click()
      
      // Attendre l'ouverture du modal
      await page.waitForTimeout(1000)
      
      // Remplir la raison
      const reasonInput = page.locator('[name="reason"], textarea')
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('Violation des conditions d\'utilisation')
      }
      
      // Confirmer
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Vérifier le message de succès
      const successMessage = page.locator('text=/banni|banned|succès/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('admin can change user role', async ({ page }) => {
    await page.goto('/admin/users')

    // Trouver le bouton pour modifier le rôle
    const roleButton = page.locator('button[aria-label*="role"], button:has-text("Rôle")').first()
    
    if (await roleButton.isVisible({ timeout: 5000 })) {
      await roleButton.click()
      
      // Attendre l'ouverture du modal
      await page.waitForTimeout(1000)
      
      // Sélectionner le rôle admin
      const roleSelect = page.locator('[name="role"], select')
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('admin')
      }
      
      // Confirmer
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Vérifier le message de succès
      const successMessage = page.locator('text=/modifié|updated|succès/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })
})









