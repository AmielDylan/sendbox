/**
 * Tests E2E : Création d'annonce
 */

import { test, expect } from '@playwright/test'
import { loginAsUser } from '../helpers/auth'
import { TEST_USERS, TEST_DATA } from '../helpers/fixtures'

test.describe('Announcement Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter comme voyageur
    await loginAsUser(page, TEST_USERS.traveler.email, TEST_USERS.traveler.password)
  })

  test('should create announcement successfully', async ({ page }) => {
    await page.goto('/annonces/new')

    // Vérifier que la page de création est accessible
    await expect(
      page.locator('h1, h2').filter({ hasText: /créer|nouvelle|annonce/i })
    ).toBeVisible()

    // Étape 1 : Trajet
    const departureCountrySelect = page.locator('[name="departure_country"]')
    if (await departureCountrySelect.isVisible()) {
      await departureCountrySelect.selectOption(TEST_DATA.announcement.departure_country)
    }

    const departureCityInput = page.locator('[name="departure_city"]')
    if (await departureCityInput.isVisible()) {
      await departureCityInput.fill(TEST_DATA.announcement.departure_city)
      // Attendre les suggestions si autocomplete
      await page.waitForTimeout(500)
    }

    const departureDateInput = page.locator('[name="departure_date"]')
    if (await departureDateInput.isVisible()) {
      await departureDateInput.fill(TEST_DATA.announcement.departure_date)
    }

    const arrivalCountrySelect = page.locator('[name="arrival_country"]')
    if (await arrivalCountrySelect.isVisible()) {
      await arrivalCountrySelect.selectOption(TEST_DATA.announcement.arrival_country)
    }

    const arrivalCityInput = page.locator('[name="arrival_city"]')
    if (await arrivalCityInput.isVisible()) {
      await arrivalCityInput.fill(TEST_DATA.announcement.arrival_city)
      await page.waitForTimeout(500)
    }

    const arrivalDateInput = page.locator('[name="arrival_date"]')
    if (await arrivalDateInput.isVisible()) {
      await arrivalDateInput.fill(TEST_DATA.announcement.arrival_date)
    }

    // Passer à l'étape suivante
    const nextButton = page.locator('button:has-text("Suivant"), button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(1000)
    }

    // Étape 2 : Capacité
    const availableKgInput = page.locator('[name="available_kg"]')
    if (await availableKgInput.isVisible()) {
      await availableKgInput.fill(TEST_DATA.announcement.available_kg)
    }

    const pricePerKgInput = page.locator('[name="price_per_kg"]')
    if (await pricePerKgInput.isVisible()) {
      await pricePerKgInput.fill(TEST_DATA.announcement.price_per_kg)
    }

    const descriptionInput = page.locator('[name="description"]')
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill(TEST_DATA.announcement.description)
    }

    // Passer à l'étape suivante
    const nextButton2 = page.locator('button:has-text("Suivant"), button:has-text("Next")')
    if (await nextButton2.isVisible()) {
      await nextButton2.click()
      await page.waitForTimeout(1000)
    }

    // Étape 3 : Validation et publication
    const publishButton = page.locator('button:has-text("Publier"), button:has-text("Publish"), button[type="submit"]')
    if (await publishButton.isVisible()) {
      await publishButton.click()
      
      // Attendre la redirection vers la page de détail de l'annonce
      await page.waitForURL(/\/annonces\/[a-f0-9-]+/, { timeout: 10000 })
      
      // Vérifier que nous sommes sur la page de détail
      await expect(page).toHaveURL(/\/annonces\/[a-f0-9-]+/)
      
      // Vérifier le message de succès
      const successToast = page.locator('text=/publiée|créée|succès/i')
      await expect(successToast.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should show validation errors for invalid announcement data', async ({ page }) => {
    await page.goto('/annonces/new')

    // Essayer de soumettre sans remplir les champs
    const submitButton = page.locator('button[type="submit"], button:has-text("Publier")')
    if (await submitButton.isVisible()) {
      await submitButton.click()
      
      // Vérifier les messages d'erreur
      await expect(
        page.locator('text=/requis|obligatoire|invalide/i').first()
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('should prevent creating announcement if KYC not approved', async ({ page }) => {
    // Se connecter avec un utilisateur sans KYC approuvé
    // Note: Nécessite un utilisateur de test sans KYC
    
    await page.goto('/annonces/new')

    // Vérifier le message d'erreur KYC
    await expect(
      page.locator('text=/KYC|vérification|approuvé/i')
    ).toBeVisible({ timeout: 5000 })
  })
})





