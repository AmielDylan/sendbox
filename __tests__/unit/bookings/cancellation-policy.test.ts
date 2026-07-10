import { describe, expect, it } from 'vitest'
import {
  getCancellationPolicy,
  isMatchingUnlocked,
} from '@/lib/core/bookings/cancellation-policy'

describe('cancellation policy V1', () => {
  it('identifie une annulation acceptée non payée comme sans frais', () => {
    const policy = getCancellationPolicy({
      status: 'accepted',
      paidAt: null,
      actorRole: 'sender',
    })

    expect(policy.outcome).toBe('free_cancellation')
    expect(policy.canCancel).toBe(true)
    expect(policy.requiresAdminReview).toBe(false)
    expect(policy.recommendedAction).toBe('cancel')
  })

  it('bloque l annulation automatique expéditeur après déverrouillage', () => {
    const policy = getCancellationPolicy({
      status: 'paid',
      paidAt: '2026-07-10T08:00:00.000Z',
      actorRole: 'sender',
    })

    expect(policy.outcome).toBe('sender_blocked_after_unlock')
    expect(policy.canCancel).toBe(false)
    expect(policy.requiresAdminReview).toBe(true)
    expect(policy.recommendedAction).toBe('dispute')
  })

  it('classe l annulation voyageur après paiement comme crédit ou remboursement à revoir', () => {
    const policy = getCancellationPolicy({
      status: 'paid',
      paidAt: '2026-07-10T08:00:00.000Z',
      actorRole: 'traveler',
    })

    expect(policy.outcome).toBe('traveler_credit_review')
    expect(policy.canCancel).toBe(true)
    expect(policy.reputationPenalty).toBe(true)
    expect(policy.recommendedAction).toBe('refund_or_credit')
  })

  it('redirige les cas après remise vers litige', () => {
    const policy = getCancellationPolicy({
      status: 'deposited',
      paidAt: '2026-07-10T08:00:00.000Z',
      actorRole: 'traveler',
    })

    expect(policy.outcome).toBe('open_dispute')
    expect(policy.canCancel).toBe(false)
    expect(policy.recommendedAction).toBe('dispute')
  })

  it('signale à l admin une annulation voyageur payée déjà clôturée', () => {
    const policy = getCancellationPolicy({
      status: 'cancelled',
      paidAt: '2026-07-10T08:00:00.000Z',
      actorRole: 'admin',
      cancelledByRole: 'traveler',
    })

    expect(policy.outcome).toBe('traveler_credit_review')
    expect(policy.requiresAdminReview).toBe(true)
    expect(policy.adminLabel).toMatch(/crédit|remboursement/i)
  })

  it('déduit le déverrouillage depuis le statut ou paid_at', () => {
    expect(isMatchingUnlocked('confirmed', null)).toBe(true)
    expect(isMatchingUnlocked('accepted', '2026-07-10T08:00:00.000Z')).toBe(
      true
    )
    expect(isMatchingUnlocked('accepted', null)).toBe(false)
  })
})
