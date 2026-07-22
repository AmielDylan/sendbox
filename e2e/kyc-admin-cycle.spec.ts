import { expect, test } from './fixtures'
import sharp from 'sharp'
import { PERSONAS } from './globalSetup'
import { createE2EAdminClient } from './helpers/supabase-admin'

test.describe.configure({ mode: 'serial' })

const removeAppAuthCache = async (page: any) => {
  await page.goto('/dashboard')
  await page.evaluate(() => {
    window.localStorage.removeItem('sendbox-auth-storage')
  })
}

async function getUserId(email: string): Promise<string> {
  const supabase = createE2EAdminClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!data?.id) throw new Error(`User not found: ${email}`)
  return data.id
}

async function resetKycProfile(userId: string) {
  const supabase = createE2EAdminClient()

  await supabase.from('kyc_reviews').delete().eq('user_id', userId)

  await supabase.from('notifications').delete().eq('user_id', userId)

  await supabase
    .from('profiles')
    .update({
      kyc_status: 'incomplete',
      verification_status: 'none',
      kyc_submitted_at: null,
      kyc_reviewed_at: null,
      verified_at: null,
      verified_name: null,
      kyc_rejection_reason: null,
      kyc_document_front: null,
      kyc_document_back: null,
      kyc_selfie: null,
    })
    .eq('id', userId)
}

async function restoreApprovedKyc(userId: string) {
  const supabase = createE2EAdminClient()

  await supabase
    .from('profiles')
    .update({
      kyc_status: 'approved',
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_name: 'Alice Dupont',
      kyc_rejection_reason: null,
      kyc_document_front: null,
      kyc_document_back: null,
      kyc_selfie: null,
    })
    .eq('id', userId)
}

async function makeJpeg(label: string) {
  const svg = `
    <svg width="1280" height="820" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="820" fill="#f7fafc"/>
      <rect x="80" y="90" width="1120" height="640" rx="38" fill="#ffffff" stroke="#111827" stroke-width="6"/>
      <circle cx="260" cy="285" r="92" fill="#d1d5db"/>
      <rect x="420" y="210" width="560" height="38" fill="#111827"/>
      <rect x="420" y="290" width="680" height="28" fill="#374151"/>
      <rect x="420" y="350" width="520" height="28" fill="#6b7280"/>
      <text x="120" y="680" font-family="Arial" font-size="42" fill="#111827">${label}</text>
    </svg>
  `

  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer()
}

async function submitKyc(senderPage: any) {
  await senderPage.goto('/dashboard/reglages/kyc')
  await expect(senderPage.locator('#doc-type')).toBeVisible({ timeout: 20_000 })

  await senderPage.locator('#doc-type').click()
  await senderPage.getByRole('option', { name: /passeport/i }).click()
  await senderPage.locator('#doc-country').click()
  await senderPage.getByRole('option', { name: /france/i }).click()

  const front = await makeJpeg('E2E PASSPORT DOCUMENT')
  const selfie = await makeJpeg('E2E SELFIE WITH DOCUMENT')
  const fileInputs = senderPage.locator('input[type="file"]')

  await fileInputs.nth(0).setInputFiles({
    name: 'e2e-passport.jpg',
    mimeType: 'image/jpeg',
    buffer: front,
  })

  await senderPage.getByRole('checkbox').check()
  await senderPage.getByRole('button', { name: /continuer/i }).click()

  await fileInputs.nth(4).setInputFiles({
    name: 'e2e-selfie.jpg',
    mimeType: 'image/jpeg',
    buffer: selfie,
  })

  await senderPage
    .getByRole('button', { name: /soumettre mon dossier/i })
    .click()
  await expect(senderPage.getByText(/dossier soumis avec succ/i)).toBeVisible({
    timeout: 20_000,
  })
}

test('KYC: soumission utilisateur, validation admin, interface utilisateur nettoyee', async ({
  senderPage,
  adminPage,
  supabaseAdmin,
}) => {
  const senderId = await getUserId(PERSONAS.sender.email)
  await resetKycProfile(senderId)
  await removeAppAuthCache(senderPage)

  try {
    await submitKyc(senderPage)

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('verification_status, kyc_status')
          .eq('id', senderId)
          .single()
        return data
      })
      .toMatchObject({
        verification_status: 'pending',
        kyc_status: 'pending',
      })

    await senderPage.goto('/dashboard')
    await expect(
      senderPage.getByText(/v.rification en cours/i).first()
    ).toBeVisible({ timeout: 20_000 })

    await adminPage.goto(`/admin/kyc/${senderId}`)
    await expect(
      adminPage.getByRole('button', { name: /valider l'identit/i })
    ).toBeEnabled({ timeout: 20_000 })
    await adminPage.getByRole('button', { name: /valider l'identit/i }).click()

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('verification_status, kyc_status')
          .eq('id', senderId)
          .single()
        return data
      })
      .toMatchObject({
        verification_status: 'verified',
        kyc_status: 'approved',
      })

    await expect
      .poll(async () => {
        const { data } = await supabaseAdmin
          .from('notifications')
          .select('title, content')
          .eq('user_id', senderId)
          .ilike('title', '%Identit%')
          .maybeSingle()
        return data
      })
      .toBeTruthy()

    await senderPage.goto('/dashboard')
    await expect(
      senderPage.getByText(/v.rifiez votre identit. pour continuer/i)
    ).toHaveCount(0)
    await expect(
      senderPage.getByRole('link', { name: /commencer/i })
    ).toHaveCount(0)
    await expect(
      senderPage.getByText(/v.rification sous 24-48h/i)
    ).toHaveCount(0)

    await senderPage.goto('/dashboard/reglages/kyc')
    await expect(
      senderPage.getByText(/identit. v.rifi.e/i)
    ).toBeVisible({ timeout: 20_000 })
  } finally {
    await restoreApprovedKyc(senderId)
  }
})
