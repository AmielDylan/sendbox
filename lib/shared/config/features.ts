/**
 * Feature flags globaux de l'application
 * Permet d'activer/désactiver des fonctionnalités sans modifier le code
 */
export const FEATURES = {
  /**
   * KYC (Know Your Customer)
   * Si false : création d'annonces autorisée avec seulement email + téléphone
   * Si true : KYC requis avant création d'annonces
   */
  KYC_ENABLED: true,

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

  /**
   * Mode Beta
   */
  BETA_MODE: true,
  MAX_BETA_USERS: 100,
  MAX_BOOKING_AMOUNT: 200,

  /**
   * Abonnement voyageur pro
   * Si false : publication de trajets autorisée sans abonnement
   * Si true : abonnement requis pour publier (trial de 14j inclus)
   */
  SUBSCRIPTION_ENABLED: true,

  /**
   * Preuve de voyage (billet) requise pour publier
   * Si false : publication sans billet acceptée
   * Si true : travel_proof_url requis avant passage draft → active
   */
  TRAVEL_PROOF_REQUIRED: false,

  /**
   * Monitoring
   */
  SENTRY_ENABLED: false,
  ANALYTICS_ENABLED: false,
} as const

export type FeatureFlag = {
  [Key in keyof typeof FEATURES]: (typeof FEATURES)[Key] extends boolean
    ? Key
    : never
}[keyof typeof FEATURES]

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
