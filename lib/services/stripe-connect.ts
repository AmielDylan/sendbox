/**
 * Stripe Connect service
 * Handles account creation, verification, and fund transfers
 */

'use server'

import { stripe } from '@/lib/shared/services/stripe/config'

export type ConnectCountry = 'FR' | 'BJ'

type AccountTokenData = {
  business_type?: 'individual' | 'company' | 'government_entity' | 'non_profit'
  individual?: Record<string, unknown>
  company?: Record<string, unknown>
  tos_shown_and_accepted?: boolean
}

/**
 * Create a Stripe Connect Custom account for a traveler
 * Custom = verification is embedded in Sendbox (whitelabel)
 */
export async function createConnectedAccount(
  userId: string,
  email: string | undefined,
  country: ConnectCountry,
  accountTokenData?: AccountTokenData
) {
  const accountToken = accountTokenData
    ? await stripe.tokens.create({
        account: {
          ...accountTokenData,
          tos_shown_and_accepted:
            accountTokenData.tos_shown_and_accepted ?? true,
        },
      })
    : null

  const account = await stripe.accounts.create({
    type: 'custom',
    country,
    ...(email ? { email } : {}),
    capabilities: {
      transfers: { requested: true },
    },
    ...(accountToken?.id
      ? { account_token: accountToken.id }
      : { business_type: 'individual' }),
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
 * Create a Connect embedded onboarding session
 */
export async function createAccountSession(accountId: string) {
  const session = await stripe.accountSessions.create({
    account: accountId,
    components: {
      account_onboarding: {
        enabled: true,
      },
    },
  })

  return session
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
