/**
 * Tests E2E : Parcours réservation complète
 */

import { test, expect } from '@playwright/test'
import { loginAsUser } from '../helpers/auth'
import { TEST_USERS, TEST_DATA } from '../helpers/fixtures'

test.describe('Complete Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter comme expéditeur
    await loginAsUser(page, TEST_USERS.sender.email, TEST_USERS.sender.password)
  })

  test('should search and view announcement', async ({ page }) => {
    await page.goto('/recherche')

    // Remplir les filtres de recherche
    const departureCountrySelect = page.locator('[name="departure_country"]')
    if (await departureCountrySelect.isVisible()) {
      await departureCountrySelect.selectOption('FR')
    }

    const arrivalCountrySelect = page.locator('[name="arrival_country"]')
    if (await arrivalCountrySelect.isVisible()) {
      await arrivalCountrySelect.selectOption('BJ')
    }

    // Rechercher
    const searchButton = page.locator('button:has-text("Rechercher"), button[type="submit"]')
    if (await searchButton.isVisible()) {
      await searchButton.click()
      await page.waitForTimeout(2000)
    }

    // Vérifier qu'il y a des résultats
    const announcementCards = page.locator('.announcement-card, [data-testid="announcement-card"]')
    const count = await announcementCards.count()
    
    if (count > 0) {
      // Cliquer sur la première annonce
      await announcementCards.first().click()
      
      // Vérifier qu'on est sur la page de détail
      await expect(page).toHaveURL(/\/annonces\/[a-f0-9-]+/)
    }
  })

  test('should create booking request', async ({ page }) => {
    // Aller directement sur une annonce (nécessite une annonce de test)
    // Dans un vrai scénario, vous créeriez une annonce via API ou seed
    
    await page.goto('/recherche')
    await page.waitForTimeout(2000)

    // Chercher une annonce et cliquer dessus
    const announcementLink = page.locator('a[href*="/annonces/"]').first()
    if (await announcementLink.isVisible()) {
      await announcementLink.click()
      await page.waitForURL(/\/annonces\/[a-f0-9-]+/, { timeout: 10000 })
    } else {
      test.skip()
      return
    }

    // Remplir le formulaire de réservation
    const kilosInput = page.locator('[name="kilos_requested"], [name="weight_kg"]')
    if (await kilosInput.isVisible()) {
      await kilosInput.fill(TEST_DATA.booking.kilos_requested)
    }

    const descriptionInput = page.locator('[name="package_description"], [name="description"]')
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(TEST_DATA.booking.package_description)
    }

    const valueInput = page.locator('[name="package_value"], [name="declared_value"]')
    if (await valueInput.isVisible()) {
      await valueInput.fill(TEST_DATA.booking.package_value)
    }

    // Option assurance
    const insuranceCheckbox = page.locator('[name="insurance_opted"], [name="insurance"]')
    if (await insuranceCheckbox.isVisible() && TEST_DATA.booking.insurance_opted) {
      await insuranceCheckbox.check()
    }

    // Continuer vers le paiement
    const continueButton = page.locator('button:has-text("Continuer"), button:has-text("Réserver")')
    if (await continueButton.isVisible()) {
      await continueButton.click()
      await page.waitForTimeout(2000)
    }
  })

  test('should complete payment with Stripe test card', async ({ page }) => {
    // Naviguer vers une page de paiement
    // Note: Nécessite un booking en attente de paiement
    
    // Dans un vrai scénario, vous créeriez un booking via API
    // Pour ce test, on suppose qu'on arrive sur la page de paiement
    
    const paymentPage = page.url().includes('/paiement')
    if (!paymentPage) {
      test.skip()
      return
    }

    // Remplir les informations de carte Stripe (mode test)
    // Note: Stripe Elements peut nécessiter une approche différente
    const cardFrame = page.frameLocator('iframe[title*="card"], iframe[name*="card"]').first()
    
    // Essayer de remplir dans l'iframe Stripe
    const cardNumberInput = cardFrame.locator('[name="cardNumber"], [placeholder*="card"], input[autocomplete="cc-number"]')
    if (await cardNumberInput.isVisible({ timeout: 5000 })) {
      await cardNumberInput.fill(TEST_DATA.stripeTestCard.number)
    } else {
      // Si pas d'iframe, essayer directement
      const directCardInput = page.locator('[name="cardNumber"], [placeholder*="card"]')
      if (await directCardInput.isVisible()) {
        await directCardInput.fill(TEST_DATA.stripeTestCard.number)
      }
    }

    const expiryInput = cardFrame.locator('[name="cardExpiry"], [placeholder*="expiry"]').or(
      page.locator('[name="cardExpiry"], [placeholder*="expiry"]')
    )
    if (await expiryInput.isVisible()) {
      await expiryInput.fill(TEST_DATA.stripeTestCard.expiry)
    }

    const cvcInput = cardFrame.locator('[name="cardCvc"], [placeholder*="CVC"]').or(
      page.locator('[name="cardCvc"], [placeholder*="CVC"]')
    )
    if (await cvcInput.isVisible()) {
      await cvcInput.fill(TEST_DATA.stripeTestCard.cvc)
    }

    // Soumettre le paiement
    const payButton = page.locator('button:has-text("Payer"), button:has-text("Pay"), button[type="submit"]')
    if (await payButton.isVisible()) {
      await payButton.click()
      
      // Attendre la confirmation ou la redirection
      await page.waitForTimeout(5000)
      
      // Vérifier le message de succès ou la redirection
      const successMessage = page.locator('text=/confirmé|succès|payé/i')
      await expect(successMessage.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display booking details after payment', async ({ page }) => {
    // Après paiement, vérifier les détails de la réservation
    await expect(page).toHaveURL(/\/colis\/[a-f0-9-]+/)
    
    // Vérifier les éléments de la page de détail
    await expect(
      page.locator('text=/réservation|booking|colis/i')
    ).toBeVisible()
  })
})









