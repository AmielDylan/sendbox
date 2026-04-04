/**
 * Server Actions — Abonnement voyageur pro
 * Stripe Billing (séparé de Stripe Connect qui gère les payouts)
 */

'use server'

import { createClient } from '@/lib/shared/db/server'
import { stripe } from '@/lib/shared/services/stripe/config'
import {
  checkCanPublish,
  type SubscriptionStatus,
  type SubscriptionInfo,
} from '@/lib/core/subscriptions/utils'

const PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Retourne le statut d'abonnement de l'utilisateur courant
 */
export async function getSubscriptionStatus(): Promise<
  SubscriptionInfo | { error: string }
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { error: 'Profil introuvable' }
  }

  const status = (profile.subscription_status ??
    'trialing') as SubscriptionStatus
  const trialEndsAt = profile.trial_ends_at as string | null

  let trialDaysRemaining: number | null = null
  if (trialEndsAt) {
    const diff = new Date(trialEndsAt).getTime() - Date.now()
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const canPublish = checkCanPublish(status, trialEndsAt)

  return {
    status,
    trial_ends_at: trialEndsAt,
    trial_days_remaining: trialDaysRemaining,
    can_publish: canPublish,
  }
}

/**
 * Crée ou récupère le Stripe Customer, puis crée une Checkout Session
 * pour souscrire à l'abonnement pro.
 * Retourne l'URL de redirection Stripe.
 */
export async function createSubscriptionCheckout(): Promise<
  { url: string } | { error: string }
> {
  if (!PRICE_ID) {
    return { error: 'STRIPE_SUBSCRIPTION_PRICE_ID non configuré' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id, subscription_status')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profil introuvable' }
  }

  // Déjà abonné
  if (profile.subscription_status === 'active') {
    return { error: 'Vous êtes déjà abonné' }
  }

  let customerId = profile.stripe_customer_id as string | null

  // Créer le Stripe Customer si inexistant
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: profile.email ?? user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    } catch (err) {
      console.error('Failed to create Stripe customer:', err)
      return { error: 'Erreur lors de la création du compte Stripe' }
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/dashboard?subscribed=1`,
      cancel_url: `${BASE_URL}/dashboard/reglages`,
      metadata: { user_id: user.id },
    })

    if (!session.url) {
      return { error: 'Impossible de créer la session de paiement' }
    }

    return { url: session.url }
  } catch (err) {
    console.error('Failed to create checkout session:', err)
    return { error: 'Erreur lors de la création de la session de paiement' }
  }
}

/**
 * Crée une session Stripe Customer Portal pour gérer l'abonnement
 * (changer le moyen de paiement, annuler, voir les factures).
 */
export async function createCustomerPortal(): Promise<
  { url: string } | { error: string }
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profil introuvable' }
  }

  const customerId = profile.stripe_customer_id as string | null

  if (!customerId) {
    return { error: 'Aucun abonnement trouvé' }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${BASE_URL}/dashboard/reglages`,
    })

    return { url: session.url }
  } catch (err) {
    console.error('Failed to create portal session:', err)
    return { error: "Erreur lors de l'ouverture du portail de facturation" }
  }
}
