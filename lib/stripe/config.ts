/**
 * Configuration Stripe
 */

import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Instance Stripe côté serveur
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  {
    apiVersion: '2025-11-17.clover',
    typescript: true,
  }
)

// Instance Stripe côté client
export const getStripeClient = () => {
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  return loadStripe(publishableKey)
}

// Webhook secret
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

