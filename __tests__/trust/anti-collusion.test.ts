import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock createAdminClient before importing functions
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/shared/db/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
    rpc: mockRpc,
  }),
}))

// Reset 'use server' directive requirement
vi.mock('@/lib/trust/anti-collusion', async () => {
  const actual = await vi.importActual('@/lib/trust/anti-collusion')
  return actual
})

import {
  checkConcentrationRatio,
  checkTransactionDuration,
  checkCollusionRing,
  runAntiCollusionChecks,
} from '@/lib/trust/anti-collusion'

function makeChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'is', 'in', 'update', 'insert', 'maybeSingle', 'single']
  methods.forEach(m => { chain[m] = () => chain })
  chain['then'] = (resolve: (v: unknown) => void) => resolve(returnValue)
  chain[Symbol.toStringTag] = 'Promise'
  // Make it thenable properly
  return new Proxy(chain, {
    get(target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return (resolve: (v: unknown) => void) => resolve(returnValue)
      }
      if (prop in target) return target[prop as string]
      return () => chain
    }
  })
}

describe('Anti-collusion checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkConcentrationRatio', () => {
    it('does nothing when fewer than CONCENTRATION_MIN_TRANSACTIONS bookings', async () => {
      mockFrom.mockReturnValue(makeChain({ data: [
        { sender_id: 'A' },
        { sender_id: 'B' },
        { sender_id: 'C' },
      ], error: null }))

      await expect(checkConcentrationRatio('traveler-1')).resolves.toBeUndefined()
    })

    it('flags a traveler when top sender ratio exceeds threshold', async () => {
      // 6 completed bookings, 5 from same sender → ratio 5/6 ≈ 0.83 > 0.60
      const bookings = [
        ...Array(5).fill({ sender_id: 'dominant-sender' }),
        { sender_id: 'other-sender' },
      ]

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: fetch completed bookings
          return makeChain({ data: bookings, error: null })
        }
        if (callCount === 2) {
          // flagExists check — not flagged yet
          return makeChain({ data: null, error: null })
        }
        // createFlag insert
        return makeChain({ data: null, error: null })
      })

      await checkConcentrationRatio('traveler-1')
      expect(mockFrom).toHaveBeenCalledWith('user_flags')
    })

    it('does not double-flag when flag already exists', async () => {
      const bookings = Array(6).fill({ sender_id: 'dominant-sender' })

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) return makeChain({ data: bookings, error: null })
        // flagExists returns an existing flag
        return makeChain({ data: { id: 'existing-flag' }, error: null })
      })

      await checkConcentrationRatio('traveler-1')
      // Should not insert a new flag
      expect(callCount).toBe(2)
    })
  })

  describe('checkTransactionDuration', () => {
    it('does nothing when duration exceeds minimum', async () => {
      await checkTransactionDuration('booking-1', 48)
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('flags booking when duration is below minimum (< 24h)', async () => {
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // flagBooking: update booking
          return makeChain({ data: null, error: null })
        }
        if (callCount === 2) {
          // fetch traveler_id
          return makeChain({ data: { traveler_id: 'traveler-1' }, error: null })
        }
        if (callCount === 3) {
          // flagExists — not yet flagged
          return makeChain({ data: null, error: null })
        }
        // createFlag insert
        return makeChain({ data: null, error: null })
      })

      await checkTransactionDuration('booking-1', 12)
      expect(mockFrom).toHaveBeenCalledWith('bookings')
    })
  })

  describe('checkCollusionRing', () => {
    it('creates a ring_collusion flag when ring detected', async () => {
      mockRpc.mockResolvedValue({ data: true, error: null })

      let flagCallCount = 0
      mockFrom.mockImplementation(() => {
        flagCallCount++
        if (flagCallCount === 1) return makeChain({ data: null, error: null }) // flagExists
        return makeChain({ data: null, error: null }) // createFlag
      })

      await checkCollusionRing('user-1')
      expect(mockFrom).toHaveBeenCalledWith('user_flags')
    })

    it('does nothing when no ring detected', async () => {
      mockRpc.mockResolvedValue({ data: false, error: null })

      await checkCollusionRing('user-1')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('handles rpc error gracefully without throwing', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('rpc error') })

      await expect(checkCollusionRing('user-1')).resolves.toBeUndefined()
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })

  describe('runAntiCollusionChecks', () => {
    it('runs all checks and resolves even if individual checks fail', async () => {
      mockRpc.mockRejectedValue(new Error('db error'))
      mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

      await expect(
        runAntiCollusionChecks('booking-1', 'traveler-1', 48)
      ).resolves.toBeUndefined()
    })
  })
})
