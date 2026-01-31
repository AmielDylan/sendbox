/**
 * Stripe Connect service
 * Handles account creation, verification, and fund transfers
 */

'use server'

import { stripe } from '@/lib/shared/services/stripe/config'

export type ConnectCountry = 'FR' | 'BJ'

/**
 * Create a Stripe Connect Express account for a traveler
 * Express = Stripe handles verification (no complex onboarding needed)
 */
export async function createConnectedAccount(
  userId: string,
  email: string | undefined,
  country: ConnectCountry
) {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    ...(email ? { email } : {}),
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      sendbox_user_id: userId,
    },
  })

  return account.id
}

/**
 * Generate an account onboarding link
 * User stays within Sendbox app (embedded onboarding)
 */
export async function createAccountLink(accountId: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reglages/paiements?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reglages/paiements?success=true`,
  })

  return link
}

/**
 * Check if account is fully set up
 */
export async function checkAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requirements: account.requirements,
  }
}

/**
 * Get dashboard link for traveler to manage Connect account
 */
export async function getExpressDashboardLink(accountId: string) {
  const link = await stripe.accounts.createLoginLink(accountId)
  return link.url
}

/**
 * Check multiple requirements to understand what's needed
 */
function parseRequirements(requirements: any) {
  if (!requirements) return { pending: [], verified: [] }

  return {
    pending: requirements.pending_verification || [],
    verified: requirements.verified || [],
  }
}
