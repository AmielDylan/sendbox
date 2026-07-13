import { describe, expect, it } from 'vitest'
import { formatTrustScore, getTrustLevel } from '@/lib/trust/levels'

describe('trust levels', () => {
  it('keeps new or unrated users neutral', () => {
    expect(getTrustLevel({ trustScore: 0, completedCount: 0 }).key).toBe('new')
    expect(getTrustLevel({ trustScore: 4.9, completedCount: 1 }).key).toBe(
      'new'
    )
  })

  it('promotes reliable users after several positive exchanges', () => {
    expect(getTrustLevel({ trustScore: 4.1, completedCount: 2 }).key).toBe(
      'reliable'
    )
  })

  it('requires no dispute for top trust levels', () => {
    expect(
      getTrustLevel({
        trustScore: 4.8,
        completedCount: 12,
        disputedCount: 1,
      }).key
    ).toBe('reliable')
    expect(
      getTrustLevel({
        trustScore: 4.8,
        completedCount: 12,
        disputedCount: 0,
      }).key
    ).toBe('ambassador')
  })

  it('formats only positive scores', () => {
    expect(formatTrustScore(4.86)).toBe('4.9')
    expect(formatTrustScore(0)).toBeNull()
    expect(formatTrustScore(null)).toBeNull()
  })
})
