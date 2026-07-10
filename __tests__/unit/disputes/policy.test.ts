import { describe, expect, it } from 'vitest'
import {
  formatDisputeReason,
  getDisputeEvidenceChecklist,
  getDisputeReason,
  isDisputableBookingStatus,
} from '@/lib/core/disputes/policy'

describe('dispute policy V1', () => {
  it('retrouve un motif par code', () => {
    const reason = getDisputeReason('package_damaged')

    expect(reason?.label).toBe('Colis endommagé à la livraison')
    expect(reason?.evidenceChecklist.length).toBeGreaterThan(0)
  })

  it('retrouve un motif par libellé existant', () => {
    const reason = getDisputeReason('Colis perdu')

    expect(reason?.code).toBe('package_lost')
  })

  it('formate un code en libellé humain', () => {
    expect(formatDisputeReason('traveler_no_show')).toBe(
      'Voyageur absent au rendez-vous'
    )
  })

  it('conserve une raison inconnue telle quelle', () => {
    expect(formatDisputeReason('Raison personnalisée')).toBe(
      'Raison personnalisée'
    )
  })

  it('retourne une checklist de secours pour un motif inconnu', () => {
    const checklist = getDisputeEvidenceChecklist('unknown_reason')

    expect(checklist).toContain('Chronologie des faits')
  })

  it('aligne les statuts litigables avec la V1', () => {
    expect(isDisputableBookingStatus('paid')).toBe(true)
    expect(isDisputableBookingStatus('confirmed')).toBe(true)
    expect(isDisputableBookingStatus('deposited')).toBe(true)
    expect(isDisputableBookingStatus('pending')).toBe(false)
    expect(isDisputableBookingStatus('cancelled')).toBe(false)
  })
})
