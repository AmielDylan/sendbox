/**
 * Feature flags globaux de l'application
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
   * Dashboard Admin
   */
  ADMIN_DASHBOARD: true,

  /**
   * Mode Beta
   */
  BETA_MODE: false,
  MAX_BETA_USERS: 100,
  MAX_BOOKING_AMOUNT: 200,

  /**
   * Preuve de voyage (billet) requise pour publier
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

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature]
}
