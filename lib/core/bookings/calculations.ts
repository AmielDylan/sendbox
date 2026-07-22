/**
 * Utilitaires pour l'estimation du prix transport.
 */

export interface BookingCalculation {
  transportPrice: number
  total: number
}

/**
 * Calcule le montant transport indicatif.
 *
 * En V1, Sendbox ne prélève pas de commission sur le transport et ne vend pas
 * d'assurance colis. Le paiement actif séparé concerne uniquement les frais de
 * mise en relation après confirmation mutuelle.
 */
export function calculateBookingPrice(
  weightKg: number,
  pricePerKg: number,
  _packageValue: number,
  _insuranceOpted: boolean
): BookingCalculation {
  void _packageValue
  void _insuranceOpted

  const safeWeightKg = Math.max(0, weightKg || 0)
  const safePricePerKg = Math.max(0, pricePerKg || 0)

  const transportPrice = safeWeightKg * safePricePerKg

  return {
    transportPrice,
    total: transportPrice,
  }
}

/**
 * Formate un montant en EUR
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} €`
}
