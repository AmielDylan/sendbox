import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_MATCHING_FEE_CENTS,
  formatFeeFromCents,
  getMatchingFeeConfig,
} from '@/lib/core/matching/fees'

const originalFeeCents = process.env.MATCHING_FEE_CENTS
const originalFeeCurrency = process.env.MATCHING_FEE_CURRENCY

afterEach(() => {
  if (originalFeeCents === undefined) delete process.env.MATCHING_FEE_CENTS
  else process.env.MATCHING_FEE_CENTS = originalFeeCents

  if (originalFeeCurrency === undefined)
    delete process.env.MATCHING_FEE_CURRENCY
  else process.env.MATCHING_FEE_CURRENCY = originalFeeCurrency
})

describe('matching fee config', () => {
  it('defaults to the public beta fee', () => {
    delete process.env.MATCHING_FEE_CENTS
    delete process.env.MATCHING_FEE_CURRENCY

    expect(getMatchingFeeConfig()).toEqual({
      amountCents: DEFAULT_MATCHING_FEE_CENTS,
      currency: 'eur',
    })
  })

  it('allows overriding the amount for private beta or standard launch', () => {
    process.env.MATCHING_FEE_CENTS = '490'
    process.env.MATCHING_FEE_CURRENCY = 'eur'

    expect(getMatchingFeeConfig()).toEqual({
      amountCents: 490,
      currency: 'eur',
    })
  })

  it('rejects invalid fee amounts', () => {
    process.env.MATCHING_FEE_CENTS = '0'

    expect(() => getMatchingFeeConfig()).toThrow(
      'MATCHING_FEE_CENTS doit etre un entier positif'
    )
  })

  it('formats cents as a readable euro amount', () => {
    expect(formatFeeFromCents(290)).toBe('2,90 EUR')
  })
})
