/**
 * Feature flags globaux de l'application
 * Permet d'activer/désactiver des fonctionnalités sans modifier le code
 */
const KYC_ENABLED = (process.env.NEXT_PUBLIC_KYC_ENABLED ?? 'true') === 'true'

export const FEATURES = {
  /**
   * KYC (Know Your Customer)
   * Si false : création d'annonces autorisée avec seulement email + téléphone
   * Si true : KYC requis avant création d'annonces
   */
  KYC_ENABLED,

  /**
   * Messagerie temps réel
   */
  REALTIME_MESSAGING: true,

  /**
   * Paiements Stripe
   */
  STRIPE_PAYMENTS: false,

  /**
   * Paiements simulés (flow complet sans Stripe)
   */
  PAYMENTS_SIMULATION: true,

  /**
   * Dashboard Admin
   */
  ADMIN_DASHBOARD: true,
} as const

export type FeatureFlag = keyof typeof FEATURES

export type PaymentsMode = 'stripe' | 'simulation' | 'disabled'

/**
 * Vérifie si une feature est activée
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature]
}

export function getPaymentsMode(): PaymentsMode {
  if (FEATURES.STRIPE_PAYMENTS) {
    return 'stripe'
  }
  if (FEATURES.PAYMENTS_SIMULATION) {
    return 'simulation'
  }
  return 'disabled'
}

export function arePaymentsEnabled(): boolean {
  return getPaymentsMode() !== 'disabled'
}
