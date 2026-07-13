import { describe, expect, it } from 'vitest'
import {
  filterReviewCriteriaForRole,
  formatReviewComment,
  getReviewCriteriaForRole,
  ratingSchema,
} from '@/lib/core/ratings/validations'
import { parseReviewComment } from '@/lib/core/ratings/display'

const validBookingId = '11111111-1111-4111-8111-111111111111'

describe('rating validation', () => {
  it('requires a rating, a concrete comment and at least one criterion', () => {
    const result = ratingSchema.safeParse({
      booking_id: validBookingId,
      rating: 5,
      comment: 'Tres bonne experience, communication claire et remise simple.',
      criteria: ['Communication claire'],
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty criteria and short comments', () => {
    const result = ratingSchema.safeParse({
      booking_id: validBookingId,
      rating: 5,
      comment: 'Bien.',
      criteria: [],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      expect(errors.comment?.[0]).toContain('20')
      expect(errors.criteria?.[0]).toContain('critere')
    }
  })

  it('filters criteria according to the real reviewer role', () => {
    const filtered = filterReviewCriteriaForRole(
      ['Communication claire', 'Declaration colis claire'],
      'traveler'
    )

    expect(filtered).toEqual([
      'Communication claire',
      'Declaration colis claire',
    ])
    expect(getReviewCriteriaForRole('sender')).toContain('Voyageur recommande')
  })

  it('formats criteria and comment for existing public review storage', () => {
    const formatted = formatReviewComment('Tout sest bien passe.', [
      'Communication claire',
      'Remise ponctuelle',
    ])

    expect(formatted).toBe(
      'Criteres : Communication claire, Remise ponctuelle\n\nTout sest bien passe.'
    )
    expect(parseReviewComment(formatted)).toEqual({
      criteria: ['Communication claire', 'Remise ponctuelle'],
      comment: 'Tout sest bien passe.',
    })
  })
})
