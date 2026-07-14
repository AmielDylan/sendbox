import { test, expect } from './fixtures'
import type { Page } from '@playwright/test'
import { createE2EAdminClient } from './helpers/supabase-admin'
import { PERSONAS } from './globalSetup'

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

async function resetSenderKYC(
  patch: Record<string, string | null> = {
    kyc_status: 'incomplete',
    verification_status: 'none',
  }
) {
  const supabase = createE2EAdminClient()
  const id = await getSenderId()
  if (!id) return

  await supabase
    .from('profiles')
    .update(patch as any)
    .eq('id', id)
}

async function waitForKYCForm(page: Page) {
  await expect(
    page.getByText(/[eéè]tape 1|pi[eè]ce d'identit[eé]/i)
  ).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('#doc-type')).toBeVisible()
  await expect(page.locator('#doc-country')).toBeVisible()
}

async function selectDocumentBasics(page: Page) {
  await page.locator('#doc-type').click()
  await page.getByRole('option', { name: /passeport/i }).click()

  await page.locator('#doc-country').click()
  await page.getByRole('option', { name: /france/i }).click()
}

test.describe('KYC V1', () => {
  test.beforeEach(async () => resetSenderKYC())

  test('affiche le formulaire document pour un profil non verifie', async ({
    senderPage,
  }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)
    await expect(senderPage.getByText(/selfie avec la pi[eè]ce/i)).toBeVisible()
  })

  test('bloque la progression tant que les preuves requises manquent', async ({
    senderPage,
  }) => {
    await senderPage.goto('/dashboard/reglages/kyc')
    await waitForKYCForm(senderPage)

    const continueButton = senderPage.getByRole('button', {
      name: /continuer/i,
    })
    await expect(continueButton).toBeDisabled()

    await selectDocumentBasics(senderPage)
    await expect(continueButton).toBeDisabled()

    await senderPage
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'passport.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-e2e-image'),
      })
    await senderPage.getByRole('checkbox').check()

    await expect(continueButton).toBeEnabled()
  })

  test('affiche le panel verifie quand le profil est deja valide', async ({
    senderPage,
  }) => {
    await resetSenderKYC({
      kyc_status: 'approved',
      verification_status: 'verified',
    })

    await senderPage.goto('/dashboard/reglages/kyc')
    await expect(
      senderPage.getByText(/identit[eé] v[eé]rifi[eé]e/i)
    ).toBeVisible({ timeout: 15_000 })
  })
})
