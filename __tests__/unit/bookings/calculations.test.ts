import { describe, it, expect } from 'vitest'
import {
  calculateBookingPrice,
  formatPrice,
} from '@/lib/core/bookings/calculations'

describe('calculateBookingPrice', () => {
  it('calcule le montant transport indicatif', () => {
    const result = calculateBookingPrice(5, 10, 100, false)

    expect(result.transportPrice).toBe(50)
    expect(result.total).toBe(50)
  })

  it('ignore la commission et l assurance en V1', () => {
    const result = calculateBookingPrice(10, 15, 5000, true)

    expect(result).toEqual({
      transportPrice: 150,
      total: 150,
    })
  })

  it('calcule correctement avec un poids decimal', () => {
    const result = calculateBookingPrice(2.5, 8, 100, false)

    expect(result.transportPrice).toBe(20)
    expect(result.total).toBe(20)
  })

  it('protege contre les valeurs negatives', () => {
    expect(calculateBookingPrice(-5, 10, 100, false)).toEqual({
      transportPrice: 0,
      total: 0,
    })
    expect(calculateBookingPrice(5, -10, 100, false)).toEqual({
      transportPrice: 0,
      total: 0,
    })
  })
})

describe('formatPrice', () => {
  it('formate correctement un montant entier', () => {
    expect(formatPrice(100)).toBe('100.00 €')
  })

  it('arrondit a 2 decimales', () => {
    expect(formatPrice(123.456)).toBe('123.46 €')
  })

  it('gere le montant a 0', () => {
    expect(formatPrice(0)).toBe('0.00 €')
  })
})
