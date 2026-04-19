/**
 * Stripe Connect service
 * Handles account creation, verification, and fund transfers
 */

import 'server-only'

import { stripe } from '@/lib/shared/services/stripe/config'
import type { ConnectCountry } from '@/lib/shared/stripe/connect-countries'

export const isStripeAccountMissing = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const anyError = error as { code?: string; message?: string }
  const message = typeof anyError.message === 'string' ? anyError.message : ''
  return (
    anyError.code === 'resource_missing' ||
    /no such account/i.test(message) ||
    /does not have access to account/i.test(message)
  )
}

export const isStripeCountryUnsupported = (error: unknown) => {
  if (!error || typeof error !== 'object') return false
  const anyError = error as { code?: string; message?: string }
  const message = typeof anyError.message === 'string' ? anyError.message : ''
  return (
    anyError.code === 'country_unsupported' ||
    /country.*unsupported/i.test(message)
  )
}

export type AccountTokenData = {
  business_type?: 'individual' | 'company' | 'government_entity' | 'non_profit'
  individual?: Record<string, unknown>
  company?: Record<string, unknown>
  tos_shown_and_accepted?: boolean
}

export const isStripeLiveMode = () => {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_PRIVATE_LIVE_SECRET_KEY ||
    ''
  return key.startsWith('sk_live')
}

/**
 * Create a Stripe Connect Custom account for a traveler
 * Custom = verification is embedded in Sendbox (whitelabel)
 */
export async function createConnectedAccount(
  userId: string,
  email: string | undefined,
  country: ConnectCountry,
  accountTokenData?: AccountTokenData,
  accountType: 'custom' | 'express' = 'custom',
  accountTokenId?: string
) {
  const shouldIncludeTos =
    accountType === 'custom' &&
    (accountTokenData?.tos_shown_and_accepted ?? true)

  let resolvedAccountTokenId = accountTokenId || null

  if (!resolvedAccountTokenId && accountTokenData) {
    if (isStripeLiveMode()) {
      throw new Error('ACCOUNT_TOKEN_REQUIRED')
    }

    const accountToken = await stripe.tokens.create({
      account: {
        ...accountTokenData,
        ...(shouldIncludeTos
          ? {
              tos_shown_and_accepted:
                accountTokenData.tos_shown_and_accepted ?? true,
            }
          : {}),
      },
    })
    resolvedAccountTokenId = accountToken.id
  }

  const account = await stripe.accounts.create({
    type: accountType,
    country,
    ...(email ? { email } : {}),
    capabilities: {
      transfers: { requested: true },
    },
    ...(resolvedAccountTokenId
      ? { account_token: resolvedAccountTokenId }
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
  try {
    const account = await stripe.accounts.retrieve(accountId)

    return {
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      requirements: account.requirements,
      missing: false,
    }
  } catch (error) {
    if (isStripeAccountMissing(error)) {
      return {
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirements: null,
        missing: true,
      }
    }
    throw error
  }
}

export async function getAccountRepresentative(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  if (account.individual?.id) {
    return { account, personId: account.individual.id }
  }

  const persons = await stripe.accounts.listPersons(accountId, { limit: 10 })
  const representative = persons.data.find(
    person => person.relationship?.representative
  )
  const personId = representative?.id || persons.data[0]?.id || null

  return { account, personId }
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
