import { test, expect } from './fixtures'
import { createE2EAdminClient } from './helpers/supabase-admin'
import { PERSONAS } from './globalSetup'

async function resetSenderKYC() {
  const supabase = createE2EAdminClient()
  const { data: users } = await supabase.auth.admin.listUsers()
  const sender = users?.users.find(u => u.email === PERSONAS.sender.email)
  if (sender) {
    await supabase
      .from('profiles')
      .update({ kyc_status: 'incomplete' })
      .eq('id', sender.id)
  }
}

test.describe('KYC — Step 1 : sélection document', () => {
  test.beforeEach(async () => resetSenderKYC())

  test('page renders country and document selectors', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await expect(senderPage.locator('#accountCountry')).toBeVisible()
    await expect(senderPage.locator('#documentCountry')).toBeVisible()
    await expect(senderPage.locator('[id="documentType"]')).toBeVisible()
  })

  test('"Continuer" disabled until all fields selected', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    const continuerBtn = senderPage.getByRole('button', { name: /continuer/i })
    await expect(continuerBtn).toBeDisabled()
  })

  test('selecting all fields enables "Continuer"', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    // Select residence country
    await senderPage.locator('#accountCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    // Select document country
    await senderPage.locator('#documentCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    // Select document type
    await senderPage.locator('[id="documentType"]').click()
    await senderPage.getByRole('option').first().click()

    await expect(senderPage.getByRole('button', { name: /continuer/i })).toBeEnabled()
  })
})

test.describe('KYC — Modal de confirmation', () => {
  test.beforeEach(async () => resetSenderKYC())

  test('modal appears after clicking "Continuer"', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await senderPage.locator('#accountCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    await senderPage.locator('#documentCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    await senderPage.locator('[id="documentType"]').click()
    await senderPage.getByRole('option').first().click()

    await senderPage.getByRole('button', { name: /continuer/i }).click()
    await expect(senderPage.getByRole('dialog')).toBeVisible()
  })

  test('"Modifier" closes modal without advancing', async ({ senderPage }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await senderPage.locator('#accountCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    await senderPage.locator('#documentCountry').click()
    await senderPage.getByRole('option', { name: /france/i }).first().click()
    await senderPage.locator('[id="documentType"]').click()
    await senderPage.getByRole('option').first().click()

    await senderPage.getByRole('button', { name: /continuer/i }).click()
    await senderPage.getByRole('button', { name: /modifier/i }).click()
    await expect(senderPage.getByRole('dialog')).not.toBeVisible()
    // Still on step 1
    await expect(senderPage.locator('#accountCountry')).toBeVisible()
  })
})

test.describe('KYC — Step 2 : formulaire détails', () => {
  test.beforeEach(async () => resetSenderKYC())

  async function goToStep2(page: import('@playwright/test').Page) {
    await page.goto('/dashboard/reglages/kyc')
    await page.locator('#accountCountry').click()
    await page.getByRole('option', { name: /france/i }).first().click()
    await page.locator('#documentCountry').click()
    await page.getByRole('option', { name: /france/i }).first().click()
    await page.locator('[id="documentType"]').click()
    await page.getByRole('option').first().click()
    await page.getByRole('button', { name: /continuer/i }).click()
    await page.getByRole('button', { name: /confirmer/i }).click()
  }

  test('callout amber "noms exacts" est visible', async ({ senderPage }) => {
    await goToStep2(senderPage)
    await expect(
      senderPage.getByText(/noms exacts tels qu'ils figurent/i)
    ).toBeVisible()
  })

  test('prénoms pré-remplis depuis le profil', async ({ senderPage }) => {
    await goToStep2(senderPage)
    await expect(senderPage.locator('#firstName')).not.toHaveValue('')
  })

  test('sélecteur indicatif téléphone visible (+33 / +229)', async ({ senderPage }) => {
    await goToStep2(senderPage)
    // Dial code selector should be present
    await expect(senderPage.getByRole('combobox').filter({ hasText: /\+/ }).first()).toBeVisible()
  })
})

test.describe('KYC — Statut affiché selon kyc_status', () => {
  test('user approved voit le panel "Identité vérifiée"', async ({ senderPage }) => {
    // senderPage already has kyc_status='approved' via globalSetup fixture
    const supabase = createE2EAdminClient()
    const { data: users } = await supabase.auth.admin.listUsers()
    const sender = users?.users.find(u => u.email === PERSONAS.sender.email)
    if (sender) {
      await supabase.from('profiles').update({ kyc_status: 'approved' }).eq('id', sender.id)
    }

    await senderPage.goto('/dashboard/reglages/kyc')
    await expect(
      senderPage.getByText(/vérifié|approuvé|identité confirmée/i).first()
    ).toBeVisible()
  })
})
