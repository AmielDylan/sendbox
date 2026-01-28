/**
 * Utilitaires pour les calculs de paiement
 */

import {
  COMMISSION_RATE,
  INSURANCE_RATE,
  INSURANCE_BASE_FEE,
} from '@/lib/core/bookings/validations'

/**
 * Calcule les montants pour un booking
 */
export function calculateBookingAmounts(
  weightKg: number,
  pricePerKg: number,
  packageValue: number,
  insuranceOpted: boolean
) {
  // Prix transport
  const totalPrice = weightKg * pricePerKg

  // Commission Sendbox (12%)
  const commissionAmount = totalPrice * COMMISSION_RATE

  // Protection du colis (si activée)
  const insurancePremium = insuranceOpted
    ? packageValue * INSURANCE_RATE + INSURANCE_BASE_FEE
    : 0

  // Total à payer
  const totalAmount = totalPrice + commissionAmount + insurancePremium

  return {
    totalPrice,
    commissionAmount,
    insurancePremium,
    totalAmount,
  }
}

/**
 * Convertit un montant en EUR vers centimes (pour Stripe)
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convertit des centimes Stripe vers EUR
 */
export function fromStripeAmount(amount: number): number {
  return amount / 100
}
