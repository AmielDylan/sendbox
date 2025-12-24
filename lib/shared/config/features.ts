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
  KYC_ENABLED: false,

  /**
   * Messagerie temps réel
   */
  REALTIME_MESSAGING: true,

  /**
   * Paiements Stripe
   */
  STRIPE_PAYMENTS: true,

  /**
   * Dashboard Admin
   */
  ADMIN_DASHBOARD: true,
} as const

export type FeatureFlag = keyof typeof FEATURES

/**
 * Vérifie si une feature est activée
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature]
}

