import { describe, it, expect } from 'vitest'
import {
  calculateBookingPrice,
  formatPrice,
} from '@/lib/core/bookings/calculations'
import {
  COMMISSION_RATE,
  INSURANCE_RATE,
  INSURANCE_BASE_FEE,
  MAX_INSURANCE_COVERAGE,
} from '@/lib/core/bookings/validations'

/**
 * Tests pour les calculs tarifaires des réservations
 */
describe('calculateBookingPrice', () => {
  describe('Calculs de base sans assurance', () => {
    it('calcule correctement le prix sans assurance', () => {
      const result = calculateBookingPrice(5, 10, 100, false)

      expect(result.transportPrice).toBe(50) // 5kg * 10€
      expect(result.commission).toBe(6) // 12% de 50€
      expect(result.subtotal).toBe(56) // 50€ + 6€
      expect(result.insurancePremium).toBeNull()
      expect(result.insuranceCoverage).toBeNull()
      expect(result.total).toBe(56)
    })

    it('calcule correctement avec poids décimal', () => {
      const result = calculateBookingPrice(2.5, 8, 100, false)

      expect(result.transportPrice).toBe(20) // 2.5kg * 8€
      expect(result.commission).toBe(2.4) // 12% de 20€
      expect(result.subtotal).toBe(22.4)
      expect(result.total).toBe(22.4)
    })

    it('applique le taux de commission correct (12%)', () => {
      const result = calculateBookingPrice(10, 5, 100, false)

      expect(result.transportPrice).toBe(50)
      expect(result.commission).toBe(50 * COMMISSION_RATE)
      expect(result.commission).toBe(6)
    })
  })

  describe('Calculs avec assurance', () => {
    it('calcule correctement avec assurance activée', () => {
      const result = calculateBookingPrice(5, 10, 100, true)

      // Transport + commission
      expect(result.transportPrice).toBe(50)
      expect(result.commission).toBe(6)
      expect(result.subtotal).toBe(56)

      // Assurance: 3% de la valeur déclarée + frais de base
      const expectedInsurance = 100 * INSURANCE_RATE + INSURANCE_BASE_FEE
      expect(result.insurancePremium).toBe(expectedInsurance)
      expect(result.insurancePremium).toBe(3) // 100 * 0.03 + 0

      // Couverture = valeur déclarée (< plafond)
      expect(result.insuranceCoverage).toBe(100)

      // Total
      expect(result.total).toBe(59) // 56 + 3
    })

    it('applique le plafond de couverture (500€)', () => {
      const result = calculateBookingPrice(5, 10, 1000, true)

      // Prime calculée sur la valeur déclarée complète
      const expectedInsurance = 1000 * INSURANCE_RATE + INSURANCE_BASE_FEE
      expect(result.insurancePremium).toBe(expectedInsurance)
      expect(result.insurancePremium).toBe(30) // 1000 * 0.03

      // Couverture plafonnée à MAX_INSURANCE_COVERAGE
      expect(result.insuranceCoverage).toBe(MAX_INSURANCE_COVERAGE)
      expect(result.insuranceCoverage).toBe(500)
    })

    it('applique le taux d assurance correct (3%)', () => {
      const result = calculateBookingPrice(5, 10, 200, true)

      expect(result.insurancePremium).toBe(
        200 * INSURANCE_RATE + INSURANCE_BASE_FEE
      )
      expect(result.insurancePremium).toBe(6) // 200 * 0.03 + 0
    })

    it('calcule correctement pour une valeur élevée de colis', () => {
      const result = calculateBookingPrice(10, 15, 5000, true)

      expect(result.transportPrice).toBe(150) // 10kg * 15€
      expect(result.commission).toBe(18) // 12% de 150€
      expect(result.subtotal).toBe(168)

      // Prime sur valeur complète
      expect(result.insurancePremium).toBe(5000 * INSURANCE_RATE) // 150
      expect(result.insurancePremium).toBe(150)

      // Couverture plafonnée
      expect(result.insuranceCoverage).toBe(500)

      expect(result.total).toBe(318) // 168 + 150
    })
  })

  describe('Cas limites', () => {
    it('gère les valeurs nulles ou invalides', () => {
      const result = calculateBookingPrice(0, 0, 0, false)

      expect(result.transportPrice).toBe(0)
      expect(result.commission).toBe(0)
      expect(result.subtotal).toBe(0)
      expect(result.total).toBe(0)
    })

    it('protège contre les valeurs négatives (poids)', () => {
      const result = calculateBookingPrice(-5, 10, 100, false)

      // Les valeurs négatives sont converties en 0
      expect(result.transportPrice).toBe(0)
      expect(result.commission).toBe(0)
      expect(result.subtotal).toBe(0)
      expect(result.total).toBe(0)
    })

    it('protège contre les valeurs négatives (prix)', () => {
      const result = calculateBookingPrice(5, -10, 100, false)

      expect(result.transportPrice).toBe(0)
      expect(result.total).toBe(0)
    })

    it('protège contre les valeurs négatives (valeur colis)', () => {
      const result = calculateBookingPrice(5, 10, -100, true)

      // Transport calculé normalement
      expect(result.transportPrice).toBe(50)
      expect(result.subtotal).toBe(56)

      // Assurance avec valeur négative => 0
      expect(result.insurancePremium).toBe(0)
      expect(result.insuranceCoverage).toBe(0)

      expect(result.total).toBe(56)
    })

    it('gère assurance avec valeur de colis à 0', () => {
      const result = calculateBookingPrice(5, 10, 0, true)

      expect(result.insurancePremium).toBe(0)
      expect(result.insuranceCoverage).toBe(0)
      expect(result.total).toBe(56) // Seulement transport + commission
    })

    it('calcule avec poids minimal (0.5kg)', () => {
      const result = calculateBookingPrice(0.5, 10, 50, false)

      expect(result.transportPrice).toBe(5)
      expect(result.commission).toBe(0.6) // 12% de 5€
      expect(result.subtotal).toBe(5.6)
      expect(result.total).toBe(5.6)
    })

    it('calcule avec poids maximal (30kg)', () => {
      const result = calculateBookingPrice(30, 15, 1000, true)

      expect(result.transportPrice).toBe(450) // 30kg * 15€
      expect(result.commission).toBe(54) // 12% de 450€
      expect(result.subtotal).toBe(504)
      expect(result.insurancePremium).toBe(30) // 1000 * 0.03
      expect(result.insuranceCoverage).toBe(500) // Plafond
      expect(result.total).toBe(534)
    })
  })

  describe('Scénarios réels', () => {
    it('exemple: colis Paris-Cotonou 5kg à 12€/kg sans assurance', () => {
      const result = calculateBookingPrice(5, 12, 200, false)

      expect(result.transportPrice).toBe(60)
      expect(result.commission).toBeCloseTo(7.2, 2) // 12% de 60€
      expect(result.subtotal).toBeCloseTo(67.2, 2)
      expect(result.insurancePremium).toBeNull()
      expect(result.total).toBeCloseTo(67.2, 2)
    })

    it('exemple: colis Paris-Cotonou 10kg à 10€/kg avec assurance 300€', () => {
      const result = calculateBookingPrice(10, 10, 300, true)

      expect(result.transportPrice).toBe(100)
      expect(result.commission).toBe(12) // 12%
      expect(result.subtotal).toBe(112)
      expect(result.insurancePremium).toBe(9) // 300 * 0.03
      expect(result.insuranceCoverage).toBe(300)
      expect(result.total).toBe(121)
    })

    it('exemple: colis Paris-Cotonou 2kg à 15€/kg avec assurance 100€', () => {
      const result = calculateBookingPrice(2, 15, 100, true)

      expect(result.transportPrice).toBe(30)
      expect(result.commission).toBeCloseTo(3.6, 2) // 12%
      expect(result.subtotal).toBeCloseTo(33.6, 2)
      expect(result.insurancePremium).toBe(3) // 100 * 0.03
      expect(result.insuranceCoverage).toBe(100)
      expect(result.total).toBeCloseTo(36.6, 2)
    })
  })
})

describe('formatPrice', () => {
  it('formate correctement un montant entier', () => {
    expect(formatPrice(100)).toBe('100.00 €')
  })

  it('formate correctement un montant décimal', () => {
    expect(formatPrice(56.7)).toBe('56.70 €')
  })

  it('formate correctement un montant avec 2 décimales', () => {
    expect(formatPrice(67.25)).toBe('67.25 €')
  })

  it('arrondit à 2 décimales', () => {
    expect(formatPrice(123.456)).toBe('123.46 €')
  })

  it('gère le montant à 0', () => {
    expect(formatPrice(0)).toBe('0.00 €')
  })

  it('gère les montants négatifs (affichage)', () => {
    expect(formatPrice(-50)).toBe('-50.00 €')
  })

  it('gère les très grands montants', () => {
    expect(formatPrice(9999.99)).toBe('9999.99 €')
  })

  it('formate les montants avec beaucoup de décimales', () => {
    expect(formatPrice(12.3456789)).toBe('12.35 €') // Arrondi
  })
})
