import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { createE2EAdminClient } from './helpers/supabase-admin'
import { PERSONAS } from './globalSetup'

// All KYC tests share the same DB user — run them serially to avoid state collisions.
test.describe.configure({ mode: 'serial' })

async function getSenderId() {
  const supabase = createE2EAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', PERSONAS.sender.email)
    .single()
  return data?.id ?? null
}

async function resetSenderToStep1() {
  const supabase = createE2EAdminClient()
  const id = await getSenderId()
  if (id) {
    await supabase
      .from('profiles')
      .update({
        kyc_status: 'incomplete',
        kyc_document_type: null,
        kyc_nationality: null,
        country: null,
      } as any)
      .eq('id', id)
  }
}

// Navigate through the Step 1 UI using Bénin (BJ) as residence country.
// BJ uses the local provider path in prepareKYCAccount (no Stripe Connect),
// so the server action is a pure DB update that resolves immediately.
async function navigateToStep2(page: Page) {
  await page.goto('/dashboard/reglages/kyc')
  await waitForKYCForm(page)

  await selectCountryInPopover(page, 'accountCountry', 'Bénin')
  await selectCountryInPopover(page, 'documentCountry', 'France')

  await page.locator('#documentType').click()
  await page.getByRole('option').first().click()

  await page.getByRole('button', { name: /continuer/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /confirmer et continuer/i }).click()
  await page.waitForSelector('#firstName', { state: 'visible', timeout: 15_000 })
}

async function waitForKYCForm(page: Page) {
  await page.waitForSelector('#accountCountry', { state: 'visible', timeout: 25_000 })
}

async function selectCountryInPopover(page: Page, triggerId: string, countryName: string) {
  await page.locator(`#${triggerId}`).click()
  const searchInput = page.locator('input[placeholder="Rechercher un pays..."]').last()
  await searchInput.waitFor({ state: 'visible', timeout: 5_000 })
  await searchInput.fill(countryName)
  await page.locator('.max-h-64 button').filter({ hasText: countryName }).first().click()
}

test.describe('KYC — Step 1 : sélection document', () => {
  test.beforeEach(async () => resetSenderToStep1())

  test('page renders country and document selectors', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)
    await expect(senderPage.locator('#accountCountry')).toBeVisible()
    await expect(senderPage.locator('#documentCountry')).toBeVisible()
    await expect(senderPage.locator('#documentType')).toBeVisible()
  })

  test('"Continuer" disabled until all fields selected', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)
    await expect(senderPage.getByRole('button', { name: /continuer/i })).toBeDisabled()
  })

  test('selecting all fields enables "Continuer"', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)

    await selectCountryInPopover(senderPage, 'accountCountry', 'France')
    await selectCountryInPopover(senderPage, 'documentCountry', 'France')

    await senderPage.locator('#documentType').click()
    await senderPage.getByRole('option').first().click()

    await expect(senderPage.getByRole('button', { name: /continuer/i })).toBeEnabled()
  })
})

test.describe('KYC — Modal de confirmation', () => {
  test.beforeEach(async () => resetSenderToStep1())

  test('modal appears after clicking "Continuer"', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)

    await selectCountryInPopover(senderPage, 'accountCountry', 'France')
    await selectCountryInPopover(senderPage, 'documentCountry', 'France')
    await senderPage.locator('#documentType').click()
    await senderPage.getByRole('option').first().click()

    await senderPage.getByRole('button', { name: /continuer/i }).click()
    await expect(senderPage.getByRole('dialog')).toBeVisible()
  })

  test('"Modifier" closes modal without advancing', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)

    await selectCountryInPopover(senderPage, 'accountCountry', 'France')
    await selectCountryInPopover(senderPage, 'documentCountry', 'France')
    await senderPage.locator('#documentType').click()
    await senderPage.getByRole('option').first().click()

    await senderPage.getByRole('button', { name: /continuer/i }).click()
    await senderPage.getByRole('button', { name: /modifier/i }).click()
    await expect(senderPage.getByRole('dialog')).not.toBeVisible()
    await expect(senderPage.locator('#accountCountry')).toBeVisible()
  })
})

test.describe('KYC — Step 2 : formulaire détails', () => {
  test.beforeEach(async () => resetSenderToStep1())

  test('callout amber "noms exacts" est visible', async ({ senderPage }) => {
    await navigateToStep2(senderPage)
    await expect(
      senderPage.getByText(/noms exacts tels qu'ils figurent/i)
    ).toBeVisible()
  })

  test('prénoms pré-remplis depuis le profil', async ({ senderPage }) => {
    await navigateToStep2(senderPage)
    await expect(senderPage.locator('#firstName')).not.toHaveValue('')
  })

  test('sélecteur indicatif téléphone visible (+33 / +229)', async ({ senderPage }) => {
    await navigateToStep2(senderPage)
    await expect(
      senderPage.getByRole('combobox').filter({ hasText: /\+/ }).first()
    ).toBeVisible()
  })
})

test.describe('KYC — Statut affiché selon kyc_status', () => {
  test('user approved voit le panel "Identité vérifiée"', async ({ senderPage }) => {
    const supabase = createE2EAdminClient()
    const id = await getSenderId()
    if (id) {
      await supabase.from('profiles').update({ kyc_status: 'approved' } as any).eq('id', id)
    }
    // Use the real sender.json storageState which has kyc_status: 'approved' in localStorage.
    // The KYC page reads from Zustand initially, so it shows the approved panel immediately.
    await senderPage.goto('/dashboard/reglages/kyc')
    await expect(
      senderPage.getByText(/vérifié|approuvé|identité (vérifiée|confirmée)/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})
