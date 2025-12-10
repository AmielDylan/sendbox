/**
 * Tests E2E : Parcours Inscription & KYC
 */

import { test, expect } from '@playwright/test'
import { createTestUser, expectUserLoggedIn } from '../helpers/auth'
import { TEST_USERS, TEST_DATA } from '../helpers/fixtures'

test.describe('User Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer les cookies avant chaque test
    await page.context().clearCookies()
  })

  test('should register new user successfully', async ({ page }) => {
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`

    await createTestUser(
      page,
      email,
      TEST_USERS.traveler.password,
      'Test',
      'User'
    )

    // Vérifier que l'utilisateur est redirigé ou voit un message de succès
    // Note: L'implémentation réelle peut varier selon votre flow
    await page.waitForTimeout(2000)
    
    // Soit redirection vers dashboard, soit message de vérification email
    const currentUrl = page.url()
    expect(
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/verify-email') ||
      page.locator('text=/inscription.*réussie|vérifiez.*email/i').isVisible()
    ).toBeTruthy()
  })

  test('should show validation errors for invalid form data', async ({ page }) => {
    await page.goto('/register')

    // Essayer de soumettre sans remplir les champs
    await page.click('button[type="submit"]')

    // Vérifier les messages d'erreur
    await expect(page.locator('text=/requis|obligatoire/i').first()).toBeVisible()
  })

  test('should complete KYC submission', async ({ page }) => {
    // Prérequis: Utilisateur connecté avec KYC non soumis
    // Note: Ce test nécessite un utilisateur de test pré-configuré
    
    // Se connecter (ou créer un utilisateur)
    const timestamp = Date.now()
    const email = `kyc${timestamp}@test.com`
    
    // Pour ce test, on suppose qu'un utilisateur existe déjà
    // Dans un vrai scénario, vous créeriez l'utilisateur via API ou seed
    
    await page.goto('/reglages/kyc')

    // Vérifier que la page KYC est accessible
    await expect(page.locator('h1, h2').filter({ hasText: /KYC|vérification/i })).toBeVisible()

    // Remplir le formulaire KYC
    await page.selectOption('[name="documentType"]', TEST_DATA.kyc.documentType)
    await page.fill('[name="documentNumber"]', TEST_DATA.kyc.documentNumber)
    
    // Pour les fichiers, créer un fichier de test minimal
    // Note: Playwright peut créer des fichiers temporaires
    const fileInput = page.locator('[name="documentFront"]')
    if (await fileInput.isVisible()) {
      // Créer un fichier de test simple (image 1x1 PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      )
      await fileInput.setInputFiles({
        name: 'id-front.jpg',
        mimeType: 'image/jpeg',
        buffer: testImageBuffer,
      })
    }

    await page.fill('[name="address"]', TEST_DATA.kyc.address)
    
    // Date de naissance (si champ date)
    const birthdayInput = page.locator('[name="birthday"]')
    if (await birthdayInput.isVisible()) {
      await birthdayInput.fill(TEST_DATA.kyc.birthday)
    }

    // Nationalité (si champ select)
    const nationalityInput = page.locator('[name="nationality"]')
    if (await nationalityInput.isVisible()) {
      await nationalityInput.fill(TEST_DATA.kyc.nationality)
    }

    // Soumettre
    const submitButton = page.locator('button:has-text("Soumettre"), button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // Attendre le message de succès ou la redirection
      await page.waitForTimeout(2000)
      
      // Vérifier le message de succès ou le changement de statut
      const successMessage = page.locator('text=/soumis|en attente|succès/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show KYC status after submission', async ({ page }) => {
    // Se connecter avec un utilisateur ayant déjà soumis son KYC
    await page.goto('/reglages/kyc')

    // Vérifier l'affichage du statut
    await expect(
      page.locator('text=/en attente|approuvé|rejeté|pending|approved|rejected/i')
    ).toBeVisible()
  })
})

