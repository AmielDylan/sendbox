import { describe, it, expect } from 'vitest'
import {
  calculateBookingAmounts,
  toStripeAmount,
  fromStripeAmount,
} from '@/lib/core/payments/calculations'
import {
  COMMISSION_RATE,
  INSURANCE_RATE,
  INSURANCE_BASE_FEE,
} from '@/lib/core/bookings/validations'

/**
 * Tests pour les calculs de paiement
 */
describe('Payment Calculations', () => {
  describe('calculateBookingAmounts', () => {
    describe('Calcul du prix de transport', () => {
      it('calcule prix de transport correct (poids × prix/kg)', () => {
        const result = calculateBookingAmounts(5, 10, 100, false)

        expect(result.totalPrice).toBe(50) // 5kg × 10€
      })

      it('gère poids décimaux', () => {
        const result = calculateBookingAmounts(2.5, 10, 100, false)

        expect(result.totalPrice).toBe(25) // 2.5kg × 10€
      })

      it('gère prix/kg décimaux', () => {
        const result = calculateBookingAmounts(3, 7.5, 100, false)

        expect(result.totalPrice).toBe(22.5) // 3kg × 7.5€
      })

      it('gère prix zéro', () => {
        const result = calculateBookingAmounts(5, 0, 100, false)

        expect(result.totalPrice).toBe(0)
      })

      it('gère poids zéro', () => {
        const result = calculateBookingAmounts(0, 10, 100, false)

        expect(result.totalPrice).toBe(0)
      })
    })

    describe('Calcul de la commission', () => {
      it('calcule commission à 3% du prix transport', () => {
        const result = calculateBookingAmounts(10, 10, 100, false)

        expect(result.totalPrice).toBe(100) // 10kg × 10€
        expect(result.commissionAmount).toBe(3) // 3% de 100€
      })

      it('calcule commission correcte pour montant décimal', () => {
        const result = calculateBookingAmounts(5, 7, 100, false)

        expect(result.totalPrice).toBe(35) // 5kg × 7€
        expect(result.commissionAmount).toBe(1.05) // 3% de 35€
      })

      it('commission est nulle si prix transport est nul', () => {
        const result = calculateBookingAmounts(0, 10, 100, false)

        expect(result.commissionAmount).toBe(0)
      })

      it('applique COMMISSION_RATE constante', () => {
        const result = calculateBookingAmounts(10, 10, 100, false)

        expect(result.commissionAmount).toBe(100 * COMMISSION_RATE)
      })
    })

    describe("Calcul de la prime d'assurance", () => {
      it('assurance nulle si non souscrite', () => {
        const result = calculateBookingAmounts(5, 10, 500, false)

        expect(result.insurancePremium).toBe(0)
      })

      it('calcule prime à 3% + frais de base si assurance souscrite', () => {
        const result = calculateBookingAmounts(5, 10, 100, true)

        const expectedPremium = 100 * INSURANCE_RATE + INSURANCE_BASE_FEE
        expect(result.insurancePremium).toBe(expectedPremium) // 3€ (3% de 100€) + 0€
      })

      it('calcule prime correcte pour valeur déclarée élevée', () => {
        const result = calculateBookingAmounts(5, 10, 1000, true)

        expect(result.insurancePremium).toBe(30) // 3% de 1000€ + 0€
      })

      it('calcule prime correcte pour valeur déclarée faible', () => {
        const result = calculateBookingAmounts(5, 10, 50, true)

        expect(result.insurancePremium).toBe(1.5) // 3% de 50€ + 0€
      })

      it('prime est nulle si valeur déclarée est zéro', () => {
        const result = calculateBookingAmounts(5, 10, 0, true)

        expect(result.insurancePremium).toBe(0) // 3% de 0€ + 0€
      })

      it('applique INSURANCE_RATE et INSURANCE_BASE_FEE constants', () => {
        const packageValue = 200
        const result = calculateBookingAmounts(5, 10, packageValue, true)

        expect(result.insurancePremium).toBe(
          packageValue * INSURANCE_RATE + INSURANCE_BASE_FEE
        )
      })
    })

    describe('Calcul du montant total', () => {
      it('totalAmount = prix transport + commission (sans assurance)', () => {
        const result = calculateBookingAmounts(10, 10, 100, false)

        expect(result.totalPrice).toBe(100)
        expect(result.commissionAmount).toBe(3) // 3% de 100€
        expect(result.totalAmount).toBe(103) // 100 + 3
      })

      it('totalAmount inclut prime assurance si souscrite', () => {
        const result = calculateBookingAmounts(10, 10, 100, true)

        expect(result.totalPrice).toBe(100)
        expect(result.commissionAmount).toBe(3) // 3% de 100€
        expect(result.insurancePremium).toBe(3) // 3% de 100€
        expect(result.totalAmount).toBe(106) // 100 + 3 + 3
      })

      it('calcule total correct pour cas complexe', () => {
        const result = calculateBookingAmounts(7.5, 8.4, 250, true)

        const transportPrice = 7.5 * 8.4 // 63€
        const commission = transportPrice * 0.03 // 1.89€
        const insurance = 250 * 0.03 // 7.5€

        expect(result.totalPrice).toBe(transportPrice)
        expect(result.commissionAmount).toBe(commission)
        expect(result.insurancePremium).toBe(insurance)
        expect(result.totalAmount).toBe(transportPrice + commission + insurance)
      })
    })

    describe('Gestion des valeurs négatives', () => {
      it('accepte poids négatif (valide mathématiquement)', () => {
        const result = calculateBookingAmounts(-5, 10, 100, false)

        expect(result.totalPrice).toBe(-50) // -5kg × 10€
        expect(result.commissionAmount).toBe(-1.5) // 3% de -50€
      })

      it('accepte prix négatif (valide mathématiquement)', () => {
        const result = calculateBookingAmounts(5, -10, 100, false)

        expect(result.totalPrice).toBe(-50) // 5kg × -10€
        expect(result.commissionAmount).toBe(-1.5) // 3% de -50€
      })
    })

    describe('Scénarios réels', () => {
      it('Scénario 1: Petit colis sans assurance', () => {
        // 2kg à 8€/kg, valeur 50€, pas d'assurance
        const result = calculateBookingAmounts(2, 8, 50, false)

        expect(result.totalPrice).toBe(16)
        expect(result.commissionAmount).toBe(0.48) // 3% de 16€
        expect(result.insurancePremium).toBe(0)
        expect(result.totalAmount).toBe(16.48)
      })

      it('Scénario 2: Colis moyen avec assurance', () => {
        // 5kg à 10€/kg, valeur 200€, avec assurance
        const result = calculateBookingAmounts(5, 10, 200, true)

        expect(result.totalPrice).toBe(50)
        expect(result.commissionAmount).toBe(1.5) // 3% de 50€
        expect(result.insurancePremium).toBe(6) // 3% de 200€
        expect(result.totalAmount).toBe(57.5)
      })

      it('Scénario 3: Gros colis avec assurance', () => {
        // 15kg à 12€/kg, valeur 800€, avec assurance
        const result = calculateBookingAmounts(15, 12, 800, true)

        expect(result.totalPrice).toBe(180)
        expect(result.commissionAmount).toBeCloseTo(5.4, 2) // 3% de 180€
        expect(result.insurancePremium).toBe(24) // 3% de 800€
        expect(result.totalAmount).toBeCloseTo(209.4, 2)
      })
    })
  })

  describe('toStripeAmount', () => {
    describe('Conversion EUR → centimes', () => {
      it('convertit 10€ en 1000 centimes', () => {
        expect(toStripeAmount(10)).toBe(1000)
      })

      it('convertit 0€ en 0 centimes', () => {
        expect(toStripeAmount(0)).toBe(0)
      })

      it('convertit 1€ en 100 centimes', () => {
        expect(toStripeAmount(1)).toBe(100)
      })

      it('convertit 100€ en 10000 centimes', () => {
        expect(toStripeAmount(100)).toBe(10000)
      })
    })

    describe('Gestion des décimales', () => {
      it('convertit 10.50€ en 1050 centimes', () => {
        expect(toStripeAmount(10.5)).toBe(1050)
      })

      it('convertit 9.99€ en 999 centimes', () => {
        expect(toStripeAmount(9.99)).toBe(999)
      })

      it('arrondit 10.555€ à 1056 centimes (arrondi mathématique)', () => {
        expect(toStripeAmount(10.555)).toBe(1056)
      })

      it('arrondit 10.554€ à 1055 centimes', () => {
        expect(toStripeAmount(10.554)).toBe(1055)
      })

      it('gère montant avec beaucoup de décimales', () => {
        expect(toStripeAmount(12.3456789)).toBe(1235)
      })
    })

    describe('Cas limites', () => {
      it('gère montant très petit (0.01€)', () => {
        expect(toStripeAmount(0.01)).toBe(1)
      })

      it('gère montant très grand (10000€)', () => {
        expect(toStripeAmount(10000)).toBe(1000000)
      })

      it('gère montant négatif', () => {
        expect(toStripeAmount(-10)).toBe(-1000)
      })
    })

    describe('Scénarios réels de paiement', () => {
      it('montant booking typique 1: 16.48€', () => {
        expect(toStripeAmount(16.48)).toBe(1648)
      })

      it('montant booking typique 2: 57.50€', () => {
        expect(toStripeAmount(57.5)).toBe(5750)
      })

      it('montant booking typique 3: 209.40€', () => {
        expect(toStripeAmount(209.4)).toBe(20940)
      })
    })
  })

  describe('fromStripeAmount', () => {
    describe('Conversion centimes → EUR', () => {
      it('convertit 1000 centimes en 10€', () => {
        expect(fromStripeAmount(1000)).toBe(10)
      })

      it('convertit 0 centimes en 0€', () => {
        expect(fromStripeAmount(0)).toBe(0)
      })

      it('convertit 100 centimes en 1€', () => {
        expect(fromStripeAmount(100)).toBe(1)
      })

      it('convertit 10000 centimes en 100€', () => {
        expect(fromStripeAmount(10000)).toBe(100)
      })
    })

    describe('Gestion des décimales', () => {
      it('convertit 1050 centimes en 10.50€', () => {
        expect(fromStripeAmount(1050)).toBe(10.5)
      })

      it('convertit 999 centimes en 9.99€', () => {
        expect(fromStripeAmount(999)).toBe(9.99)
      })

      it('convertit 1 centime en 0.01€', () => {
        expect(fromStripeAmount(1)).toBe(0.01)
      })
    })

    describe('Cas limites', () => {
      it('gère montant très grand', () => {
        expect(fromStripeAmount(1000000)).toBe(10000)
      })

      it('gère montant négatif', () => {
        expect(fromStripeAmount(-1000)).toBe(-10)
      })
    })

    describe('Scénarios réels de paiement', () => {
      it('montant booking typique 1: 1648 centimes → 16.48€', () => {
        expect(fromStripeAmount(1648)).toBe(16.48)
      })

      it('montant booking typique 2: 5750 centimes → 57.50€', () => {
        expect(fromStripeAmount(5750)).toBe(57.5)
      })

      it('montant booking typique 3: 20940 centimes → 209.40€', () => {
        expect(fromStripeAmount(20940)).toBe(209.4)
      })
    })
  })

  describe('Conversion aller-retour (round-trip)', () => {
    it('EUR → centimes → EUR conserve la valeur', () => {
      const originalAmount = 123.45
      const stripeAmount = toStripeAmount(originalAmount)
      const convertedBack = fromStripeAmount(stripeAmount)

      expect(convertedBack).toBe(originalAmount)
    })

    it('centimes → EUR → centimes conserve la valeur', () => {
      const originalCents = 12345
      const eurAmount = fromStripeAmount(originalCents)
      const convertedBack = toStripeAmount(eurAmount)

      expect(convertedBack).toBe(originalCents)
    })

    it('round-trip avec montant booking réel', () => {
      const bookingAmount = 209.4
      const cents = toStripeAmount(bookingAmount)
      const backToEur = fromStripeAmount(cents)

      expect(backToEur).toBe(bookingAmount)
    })
  })

  describe('Intégration avec calculateBookingAmounts', () => {
    it('peut convertir totalAmount en centimes Stripe', () => {
      // 5kg × 10€ = 50€, commission 3% = 1.5€, insurance 200×3% = 6€, total = 57.5€
      const result = calculateBookingAmounts(5, 10, 200, true)
      const stripeAmount = toStripeAmount(result.totalAmount)

      expect(stripeAmount).toBe(5750) // 57.5€ en centimes
    })

    it('peut convertir tous les montants pour Stripe', () => {
      // 10kg × 10€ = 100€, commission 3% = 3€, insurance 3% = 3€, total = 106€
      const result = calculateBookingAmounts(10, 10, 100, true)

      expect(toStripeAmount(result.totalPrice)).toBe(10000) // 100€
      expect(toStripeAmount(result.commissionAmount)).toBe(300) // 3€
      expect(toStripeAmount(result.insurancePremium)).toBe(300) // 3€
      expect(toStripeAmount(result.totalAmount)).toBe(10600) // 106€
    })
  })
})
