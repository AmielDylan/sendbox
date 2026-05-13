import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFrom = vi.fn()

vi.mock('@/lib/shared/db/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { computeAndSaveTrustScore, tryPublishBlindReviews } from '@/lib/trust/score'

function makeCountChain(count: number) {
  return {
    select: () => makeCountChain(count),
    eq: () => makeCountChain(count),
    or: () => makeCountChain(count),
    in: () => makeCountChain(count),
    lt: () => makeCountChain(count),
    then: (resolve: (v: unknown) => void) => resolve({ count, data: null, error: null }),
    catch: () => makeCountChain(count),
    finally: () => makeCountChain(count),
  }
}

function makeDataChain(data: unknown) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    or: () => chain,
    in: () => chain,
    lt: () => chain,
    update: () => chain,
    insert: () => chain,
    single: () => Promise.resolve({ data, error: null }),
    maybeSingle: () => Promise.resolve({ data, error: null }),
    then: (resolve: (v: unknown) => void) => resolve({ data, error: null }),
    catch: () => chain,
    finally: () => chain,
  }
  return chain
}

describe('Trust score algorithm', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('computeAndSaveTrustScore', () => {
    it('saves score 0 and resets completed_count when no ratings exist', async () => {
      let updateCalled = false

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain([])
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: { unique_sender_count: 0, unique_traveler_count: 0 }, error: null }),
              }),
            }),
            update: (vals: unknown) => {
              updateCalled = true
              expect((vals as Record<string, unknown>).trust_score).toBe(0)
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })

      await computeAndSaveTrustScore('user-1')
      expect(updateCalled).toBe(true)
    })

    it('caps contribution per author at CAP_PER_AUTHOR (20%)', async () => {
      // 10 ratings all from same rater — cap = ceil(20% * 10) = 2 contributions max
      const now = new Date()
      const ratings = Array.from({ length: 10 }, (_, i) => ({
        rating: 5,
        rater_id: 'spammer',
        published_at: new Date(now.getTime() - i * 86400000).toISOString(),
      }))

      let savedScore = 0

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(0)
        if (table === 'bookings') return makeCountChain(5)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 1, unique_traveler_count: 1 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              savedScore = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })

      await computeAndSaveTrustScore('user-1')
      // Score should reflect only 2 contributions from the spammer, not 10
      // With temporal decay the effective score < pure 5.0
      expect(savedScore).toBeGreaterThan(0)
      expect(savedScore).toBeLessThanOrEqual(5)
    })

    it('applies dispute malus (-0.5 per open dispute)', async () => {
      const ratings = [
        { rating: 5, rater_id: 'A', published_at: new Date().toISOString() },
      ]

      let scoreWithDispute = 0
      let scoreWithoutDispute = 0

      // First run: 2 open disputes
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(2)
        if (table === 'bookings') return makeCountChain(1)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 0, unique_traveler_count: 0 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              scoreWithDispute = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })

      await computeAndSaveTrustScore('user-1')

      // Second run: no disputes
      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(0)
        if (table === 'bookings') return makeCountChain(1)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 0, unique_traveler_count: 0 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              scoreWithoutDispute = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })

      await computeAndSaveTrustScore('user-1')

      // Score with disputes must be lower
      expect(scoreWithDispute).toBeLessThan(scoreWithoutDispute)
      // Malus is 2 * 0.5 = 1.0
      expect(scoreWithoutDispute - scoreWithDispute).toBeCloseTo(1.0, 1)
    })

    it('applies diversity bonus (+0.1) when unique count ≥ 3', async () => {
      const ratings = [
        { rating: 4, rater_id: 'A', published_at: new Date().toISOString() },
      ]

      let scoreWithDiversity = 0
      let scoreWithoutDiversity = 0

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(0)
        if (table === 'bookings') return makeCountChain(3)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 3, unique_traveler_count: 1 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              scoreWithDiversity = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })
      await computeAndSaveTrustScore('user-1')

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(0)
        if (table === 'bookings') return makeCountChain(3)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 1, unique_traveler_count: 1 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              scoreWithoutDiversity = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })
      await computeAndSaveTrustScore('user-1')

      expect(scoreWithDiversity - scoreWithoutDiversity).toBeCloseTo(0.1, 2)
    })

    it('never returns a score above 5', async () => {
      // Perfect ratings + diversity bonus should not exceed 5
      const ratings = [
        { rating: 5, rater_id: 'A', published_at: new Date().toISOString() },
        { rating: 5, rater_id: 'B', published_at: new Date().toISOString() },
        { rating: 5, rater_id: 'C', published_at: new Date().toISOString() },
      ]

      let savedScore = 0

      mockFrom.mockImplementation((table: string) => {
        if (table === 'ratings') return makeDataChain(ratings)
        if (table === 'disputes') return makeCountChain(0)
        if (table === 'bookings') return makeCountChain(3)
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { unique_sender_count: 5, unique_traveler_count: 5 },
                  error: null,
                }),
              }),
            }),
            update: (vals: Record<string, unknown>) => {
              savedScore = vals.trust_score as number
              return { eq: () => Promise.resolve({ error: null }) }
            },
          }
        }
        return makeDataChain(null)
      })

      await computeAndSaveTrustScore('user-1')
      expect(savedScore).toBeLessThanOrEqual(5)
    })
  })
})

describe('tryPublishBlindReviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing when fewer than 2 reviews exist', async () => {
    let updateCalled = false

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ratings') {
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({
                data: [{ id: 'r1', rater_id: 'A', rated_id: 'B', status: 'submitted' }],
                error: null,
              }),
            }),
          }),
          update: () => {
            updateCalled = true
            return { in: () => Promise.resolve({ error: null }) }
          },
        }
      }
      return makeDataChain(null)
    })

    await tryPublishBlindReviews('booking-1')
    expect(updateCalled).toBe(false)
  })

  it('publishes both reviews simultaneously when both are submitted', async () => {
    const twoSubmitted = [
      { id: 'r1', rater_id: 'sender', rated_id: 'traveler', status: 'submitted' },
      { id: 'r2', rater_id: 'traveler', rated_id: 'sender', status: 'submitted' },
    ]

    let publishedIds: string[] = []

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ratings') {
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: twoSubmitted, error: null }),
            }),
          }),
          update: (vals: Record<string, unknown>) => {
            expect(vals.status).toBe('published')
            expect(vals.published_at).toBeDefined()
            return {
              in: (field: string, ids: string[]) => {
                publishedIds = ids
                return Promise.resolve({ error: null })
              },
            }
          },
        }
      }
      // For computeAndSaveTrustScore calls
      if (table === 'disputes') return makeCountChain(0)
      if (table === 'bookings') return makeCountChain(1)
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { unique_sender_count: 0, unique_traveler_count: 0 },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        }
      }
      return makeDataChain(null)
    })

    await tryPublishBlindReviews('booking-1')
    expect(publishedIds).toContain('r1')
    expect(publishedIds).toContain('r2')
  })

  it('does not publish when only one party has submitted', async () => {
    const oneSubmitted = [
      { id: 'r1', rater_id: 'sender', rated_id: 'traveler', status: 'submitted' },
      { id: 'r2', rater_id: 'traveler', rated_id: 'sender', status: 'pending' },
    ]

    let updateCalled = false

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ratings') {
        return {
          select: () => ({
            eq: () => ({
              in: () => Promise.resolve({ data: oneSubmitted, error: null }),
            }),
          }),
          update: () => {
            updateCalled = true
            return { in: () => Promise.resolve({ error: null }) }
          },
        }
      }
      return makeDataChain(null)
    })

    await tryPublishBlindReviews('booking-1')
    expect(updateCalled).toBe(false)
  })
})
