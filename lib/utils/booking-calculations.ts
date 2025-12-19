/**
 * Utilitaires pour les calculs tarifaires des réservations
 */

import {
  COMMISSION_RATE,
  INSURANCE_RATE,
  INSURANCE_BASE_FEE,
  MAX_INSURANCE_COVERAGE,
} from '@/lib/validations/booking'

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
  // Prix transport
  const transportPrice = weightKg * pricePerKg

  // Commission Sendbox (12%)
  const commission = transportPrice * COMMISSION_RATE

  // Sous-total
  const subtotal = transportPrice + commission

  // Assurance (si souscrite)
  let insurancePremium: number | null = null
  let insuranceCoverage: number | null = null

  if (insuranceOpted) {
    // Prime = 1.5% de la valeur + 2 EUR de base
    insurancePremium = packageValue * INSURANCE_RATE + INSURANCE_BASE_FEE
    // Couverture : jusqu'à 500 EUR ou valeur déclarée si < 500
    insuranceCoverage = Math.min(packageValue, MAX_INSURANCE_COVERAGE)
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





