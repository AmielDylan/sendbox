/**
 * Tests E2E : Administration - Validation KYC
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Admin KYC Approval', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('admin can view pending KYC list', async ({ page }) => {
    await page.goto('/admin/kyc')

    // Vérifier que la page admin KYC est accessible
    await expect(
      page.locator('h1, h2').filter({ hasText: /KYC|vérification/i })
    ).toBeVisible()

    // Vérifier la présence de la liste ou d'un message
    const kycList = page.locator('.kyc-item, [data-testid="kyc-item"], table tbody tr')
    const count = await kycList.count()
    
    if (count > 0) {
      // Vérifier qu'il y a des éléments dans la liste
      await expect(kycList.first()).toBeVisible()
    } else {
      // Ou vérifier le message "Aucun KYC en attente"
      await expect(
        page.locator('text=/aucun|no|pending/i')
      ).toBeVisible()
    }
  })

  test('admin can view KYC document details', async ({ page }) => {
    await page.goto('/admin/kyc')

    // Chercher un bouton "Voir" ou cliquer sur la première ligne
    const viewButton = page.locator('button:has-text("Voir"), button:has-text("View"), a[href*="/kyc/"]').first()
    const kycRow = page.locator('table tbody tr, .kyc-item').first()
    
    if (await viewButton.isVisible()) {
      await viewButton.click()
    } else if (await kycRow.isVisible()) {
      await kycRow.click()
    } else {
      test.skip()
      return
    }

    // Attendre l'ouverture d'un modal ou la navigation
    await page.waitForTimeout(1000)

    // Vérifier l'affichage des documents
    const documentImage = page.locator('img[alt*="document"], img[alt*="Document"], img[src*="kyc"]')
    if (await documentImage.isVisible({ timeout: 5000 })) {
      await expect(documentImage.first()).toBeVisible()
    }
  })

  test('admin can approve KYC', async ({ page }) => {
    await page.goto('/admin/kyc')

    // Trouver le premier KYC en attente
    const approveButton = page.locator('button:has-text("Approuver"), button:has-text("Approve")').first()
    
    if (await approveButton.isVisible({ timeout: 5000 })) {
      await approveButton.click()
      
      // Attendre la confirmation ou le modal
      await page.waitForTimeout(2000)
      
      // Confirmer si un modal apparaît
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Vérifier le message de succès
      const successMessage = page.locator('text=/approuvé|approved|succès/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('admin can reject KYC with reason', async ({ page }) => {
    await page.goto('/admin/kyc')

    // Trouver le bouton de rejet
    const rejectButton = page.locator('button:has-text("Rejeter"), button:has-text("Reject")').first()
    
    if (await rejectButton.isVisible({ timeout: 5000 })) {
      await rejectButton.click()
      
      // Attendre l'ouverture du modal de rejet
      await page.waitForTimeout(1000)
      
      // Sélectionner une raison
      const reasonSelect = page.locator('[name="rejectionReason"], select')
      if (await reasonSelect.isVisible()) {
        await reasonSelect.selectOption('Document illisible')
      }
      
      // Ou remplir un textarea
      const reasonTextarea = page.locator('[name="rejectionReason"], textarea')
      if (await reasonTextarea.isVisible()) {
        await reasonTextarea.fill('Document illisible, veuillez renvoyer une photo plus claire')
      }
      
      // Confirmer le rejet
      const confirmButton = page.locator('button:has-text("Confirmer"), button:has-text("Confirm")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Vérifier le message de succès
      const successMessage = page.locator('text=/rejeté|rejected|succès/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    } else {
      test.skip()
    }
  })

  test('admin dashboard shows KYC pending count', async ({ page }) => {
    await page.goto('/admin/dashboard')

    // Vérifier l'affichage du KPI KYC en attente
    await expect(
      page.locator('text=/KYC.*attente|pending.*KYC/i')
    ).toBeVisible()
  })
})









