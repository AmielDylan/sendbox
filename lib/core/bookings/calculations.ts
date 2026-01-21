/**
 * Utilitaires pour les calculs tarifaires des réservations
 */

import {
  COMMISSION_RATE,
  INSURANCE_RATE,
  INSURANCE_BASE_FEE,
  MAX_INSURANCE_COVERAGE,
} from "@/lib/core/bookings/validations"

export interface BookingCalculation {
  transportPrice: number
  commission: number
  subtotal: number
  insurancePremium: number | null
  total: number
  insuranceCoverage: number | null
}

/**
 * Calcule le tarif total d'une réservation
 */
export function calculateBookingPrice(
  weightKg: number,
  pricePerKg: number,
  packageValue: number,
  insuranceOpted: boolean
): BookingCalculation {
  // S'assurer que les valeurs sont valides
  const safeWeightKg = Math.max(0, weightKg || 0)
  const safePricePerKg = Math.max(0, pricePerKg || 0)
  const safePackageValue = Math.max(0, packageValue || 0)

  // Prix transport
  const transportPrice = safeWeightKg * safePricePerKg

  // Commission Sendbox (12%)
  const commission = transportPrice * COMMISSION_RATE

  // Sous-total
  const subtotal = transportPrice + commission

  // Protection du colis (si activée)
  let insurancePremium: number | null = null
  let insuranceCoverage: number | null = null

  if (insuranceOpted) {
    // Prime = % de la valeur déclarée
    insurancePremium = safePackageValue * INSURANCE_RATE + INSURANCE_BASE_FEE
    // Plafond : jusqu'à MAX_INSURANCE_COVERAGE ou valeur déclarée si < plafond
    insuranceCoverage = Math.min(safePackageValue, MAX_INSURANCE_COVERAGE)
  }

  // Total final
  const total = subtotal + (insurancePremium || 0)

  return {
    transportPrice,
    commission,
    subtotal,
    insurancePremium,
    total,
    insuranceCoverage,
  }
}

/**
 * Formate un montant en EUR
 */
export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} €`
}








