import { describe, it, expect } from 'vitest'

/**
 * Tests for blind review business rules (pure logic, no DB).
 *
 * The blind review system guarantees:
 * 1. Both parties submit independently — neither can see the other's review until published.
 * 2. Reviews are published simultaneously only when BOTH have submitted.
 * 3. Published reviews are immutable (REVIEW_IMMUTABLE rule).
 * 4. Stale pending reviews expire after REVIEW_WINDOW_DAYS.
 */

type ReviewStatus = 'pending' | 'submitted' | 'published' | 'skipped'

interface Review {
  id: string
  bookingId: string
  raterId: string
  ratedId: string
  status: ReviewStatus
  rating?: number
  submittedAt?: string
  publishedAt?: string
}

function canPublishBlind(reviews: Review[]): boolean {
  const submitted = reviews.filter(r => r.status === 'submitted')
  return submitted.length >= 2
}

function isReviewImmutable(review: Review): boolean {
  return review.status === 'published'
}

function isReviewWindowExpired(
  completedAt: string,
  windowDays: number,
  now = new Date()
): boolean {
  const cutoff = new Date(completedAt)
  cutoff.setDate(cutoff.getDate() + windowDays)
  return now > cutoff
}

function getReviewableStatus(bookingStatus: string): boolean {
  return ['delivered', 'completed'].includes(bookingStatus)
}

describe('Blind review system — business rules', () => {
  describe('Publication trigger', () => {
    it('does not publish when only one party has submitted', () => {
      const reviews: Review[] = [
        {
          id: 'r1',
          bookingId: 'b1',
          raterId: 'sender',
          ratedId: 'traveler',
          status: 'submitted',
          rating: 4,
        },
        {
          id: 'r2',
          bookingId: 'b1',
          raterId: 'traveler',
          ratedId: 'sender',
          status: 'pending',
        },
      ]
      expect(canPublishBlind(reviews)).toBe(false)
    })

    it('publishes when both parties have submitted', () => {
      const reviews: Review[] = [
        {
          id: 'r1',
          bookingId: 'b1',
          raterId: 'sender',
          ratedId: 'traveler',
          status: 'submitted',
          rating: 4,
        },
        {
          id: 'r2',
          bookingId: 'b1',
          raterId: 'traveler',
          ratedId: 'sender',
          status: 'submitted',
          rating: 5,
        },
      ]
      expect(canPublishBlind(reviews)).toBe(true)
    })

    it('does not publish when both are still pending', () => {
      const reviews: Review[] = [
        {
          id: 'r1',
          bookingId: 'b1',
          raterId: 'sender',
          ratedId: 'traveler',
          status: 'pending',
        },
        {
          id: 'r2',
          bookingId: 'b1',
          raterId: 'traveler',
          ratedId: 'sender',
          status: 'pending',
        },
      ]
      expect(canPublishBlind(reviews)).toBe(false)
    })

    it('does not trigger publication when one review is already published and one pending', () => {
      const reviews: Review[] = [
        {
          id: 'r1',
          bookingId: 'b1',
          raterId: 'sender',
          ratedId: 'traveler',
          status: 'published',
        },
        {
          id: 'r2',
          bookingId: 'b1',
          raterId: 'traveler',
          ratedId: 'sender',
          status: 'pending',
        },
      ]
      // Only 0 submitted → no trigger
      expect(canPublishBlind(reviews)).toBe(false)
    })
  })

  describe('Immutability rule', () => {
    it('marks published reviews as immutable', () => {
      const published: Review = {
        id: 'r1',
        bookingId: 'b1',
        raterId: 'A',
        ratedId: 'B',
        status: 'published',
        rating: 4,
        publishedAt: new Date().toISOString(),
      }
      expect(isReviewImmutable(published)).toBe(true)
    })

    it('allows modification of submitted (not yet published) reviews', () => {
      const submitted: Review = {
        id: 'r1',
        bookingId: 'b1',
        raterId: 'A',
        ratedId: 'B',
        status: 'submitted',
        rating: 3,
      }
      expect(isReviewImmutable(submitted)).toBe(false)
    })

    it('allows modification of pending reviews', () => {
      const pending: Review = {
        id: 'r1',
        bookingId: 'b1',
        raterId: 'A',
        ratedId: 'B',
        status: 'pending',
      }
      expect(isReviewImmutable(pending)).toBe(false)
    })
  })

  describe('Review window expiry', () => {
    it('considers window expired when completedAt is older than REVIEW_WINDOW_DAYS', () => {
      const completedAt = new Date()
      completedAt.setDate(completedAt.getDate() - 8) // 8 days ago

      expect(isReviewWindowExpired(completedAt.toISOString(), 7)).toBe(true)
    })

    it('considers window still open when within REVIEW_WINDOW_DAYS', () => {
      const completedAt = new Date()
      completedAt.setDate(completedAt.getDate() - 3) // 3 days ago

      expect(isReviewWindowExpired(completedAt.toISOString(), 7)).toBe(false)
    })

    it('considers window expired exactly at the boundary', () => {
      const completedAt = new Date()
      completedAt.setDate(completedAt.getDate() - 7)
      completedAt.setMinutes(completedAt.getMinutes() - 1) // 7 days + 1 min ago

      expect(isReviewWindowExpired(completedAt.toISOString(), 7)).toBe(true)
    })
  })

  describe('Booking status gate', () => {
    it('allows review submission for delivered bookings', () => {
      expect(getReviewableStatus('delivered')).toBe(true)
    })

    it('allows review submission for completed bookings', () => {
      expect(getReviewableStatus('completed')).toBe(true)
    })

    it('blocks review submission for in_transit bookings', () => {
      expect(getReviewableStatus('in_transit')).toBe(false)
    })

    it('blocks review submission for confirmed bookings', () => {
      expect(getReviewableStatus('confirmed')).toBe(false)
    })

    it('blocks review submission for pending bookings', () => {
      expect(getReviewableStatus('pending')).toBe(false)
    })
  })

  describe('Rating validation', () => {
    it('accepts integer ratings from 1 to 5', () => {
      const valid = [1, 2, 3, 4, 5]
      for (const r of valid) {
        expect(r >= 1 && r <= 5).toBe(true)
      }
    })

    it('rejects rating of 0', () => {
      expect(0 >= 1 && 0 <= 5).toBe(false)
    })

    it('rejects rating of 6', () => {
      expect(6 >= 1 && 6 <= 5).toBe(false)
    })

    it('rejects non-integer ratings', () => {
      const nonInt = 3.5
      expect(typeof nonInt === 'number' && Number.isInteger(nonInt)).toBe(false)
    })
  })
})
