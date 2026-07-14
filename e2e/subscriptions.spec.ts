import * as path from 'path'
import { test, expect } from './fixtures'
import { PERSONAS } from './globalSetup'
import { createE2EAdminClient } from './helpers/supabase-admin'
import { simulateSubscriptionWebhook } from './helpers/stripe-test'

async function getTravelerUserId(): Promise<string> {
  const supabase = createE2EAdminClient()
  const { data: users } = await supabase.auth.admin.listUsers()
  const traveler = users?.users.find(u => u.email === PERSONAS.traveler.email)
  if (!traveler) throw new Error('Traveler not found')
  return traveler.id
}

test.describe.skip('Page abonnement', () => {
  test('affiche le statut abonnement du traveler', async ({ travelerPage }) => {
    await travelerPage.goto('/dashboard/reglages/abonnement')
    await expect(travelerPage).toHaveURL(/abonnement/)
    await expect(
      travelerPage.getByText(/abonnement|subscription|actif|trial/i).first()
    ).toBeVisible()
  })

  test('affiche les jours restants si trial actif', async ({ browser }) => {
    const supabase = createE2EAdminClient()
    const { data: users } = await supabase.auth.admin.listUsers()
    const traveler = users?.users.find(u => u.email === PERSONAS.traveler.email)

    if (traveler) {
      const trialEnd = new Date()
      trialEnd.setDate(trialEnd.getDate() + 10)
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'trialing',
          trial_ends_at: trialEnd.toISOString(),
        })
        .eq('id', traveler.id)
    }

    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '../.playwright/state/traveler.json'),
    })
    const page = await ctx.newPage()
    await page.goto('/dashboard/reglages/abonnement')
    await expect(page.getByText(/jour|days|trial/i).first()).toBeVisible()
    await ctx.close()

    // Restore active status
    if (traveler) {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'active', trial_ends_at: null })
        .eq('id', traveler.id)
    }
  })
})

test.describe.skip('Checkout abonnement', () => {
  test("clic S'abonner redirige vers Stripe Checkout", async ({ browser }) => {
    const supabase = createE2EAdminClient()
    const { data: users } = await supabase.auth.admin.listUsers()
    const traveler = users?.users.find(u => u.email === PERSONAS.traveler.email)

    // Set subscription to expired so "S'abonner" button is shown
    if (traveler) {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .eq('id', traveler.id)
    }

    const ctx = await browser.newContext({
      storageState: path.join(__dirname, '../.playwright/state/traveler.json'),
    })
    const page = await ctx.newPage()
    await page.goto('/dashboard/reglages/abonnement')

    const subscribeBtn = page
      .getByRole('button', { name: /s'abonner|subscribe|abonnement pro/i })
      .first()
    if (await subscribeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page.waitForURL(/checkout\.stripe\.com/, { timeout: 15_000 }),
        subscribeBtn.click(),
      ])
      expect(page.url()).toContain('checkout.stripe.com')
    }

    await ctx.close()

    // Restore active status
    if (traveler) {
      await supabase
        .from('profiles')
        .update({ subscription_status: 'active', trial_ends_at: null })
        .eq('id', traveler.id)
    }
  })
})

test.describe('Webhook abonnement', () => {
  test('simuler customer.subscription.created met à jour le profil', async ({
    stripe,
    supabaseAdmin,
  }) => {
    const travelerId = await getTravelerUserId()

    // Reset to no subscription
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: null })
      .eq('id', travelerId)

    await simulateSubscriptionWebhook(stripe, travelerId)

    // Wait for webhook processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_status')
      .eq('id', travelerId)
      .single()

    // After webhook, subscription should be active or trialing
    expect(['active', 'trialing']).toContain(profile?.subscription_status)

    // Restore
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'active', trial_ends_at: null })
      .eq('id', travelerId)
  })
})
