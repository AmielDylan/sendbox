import { describe, expect, it } from 'vitest'
import {
  formatDisputeReason,
  getDisputeEvidenceChecklist,
  getDisputeReason,
  isDisputeReason,
  isDisputableBookingStatus,
  isOpenDisputeStatus,
  normalizeDisputeDescription,
} from '@/lib/core/disputes/policy'

describe('dispute policy V1', () => {
  it('retrouve un motif par code', () => {
    const reason = getDisputeReason('package_damaged')

    expect(reason?.code).toBe('package_damaged')
    expect(reason?.evidenceChecklist.length).toBeGreaterThan(0)
  })

  it('retrouve un motif par libelle existant', () => {
    const reason = getDisputeReason('Colis perdu')

    expect(reason?.code).toBe('package_lost')
  })

  it('formate un code en libelle humain', () => {
    expect(formatDisputeReason('traveler_no_show')).toBe(
      'Voyageur absent au rendez-vous'
    )
  })

  it('expose les motifs V1 pour voyage annule et comportement suspect', () => {
    expect(formatDisputeReason('travel_cancelled')).toBe(
      'Voyage annule ou impossible'
    )
    expect(formatDisputeReason('suspicious_behavior')).toBe(
      'Comportement suspect'
    )
    expect(isDisputeReason('travel_cancelled')).toBe(true)
    expect(isDisputeReason('Comportement suspect')).toBe(true)
  })

  it('conserve une raison inconnue telle quelle au formatage', () => {
    expect(formatDisputeReason('Raison personnalisee')).toBe(
      'Raison personnalisee'
    )
    expect(isDisputeReason('Raison personnalisee')).toBe(false)
  })

  it('retourne une checklist de secours pour un motif inconnu', () => {
    const checklist = getDisputeEvidenceChecklist('unknown_reason')

    expect(checklist).toContain('Chronologie des faits')
  })

  it('aligne les statuts litigables avec la V1', () => {
    expect(isDisputableBookingStatus('paid')).toBe(true)
    expect(isDisputableBookingStatus('confirmed')).toBe(true)
    expect(isDisputableBookingStatus('deposited')).toBe(true)
    expect(isDisputableBookingStatus('DELIVERED')).toBe(true)
    expect(isDisputableBookingStatus('pending')).toBe(false)
    expect(isDisputableBookingStatus('cancelled')).toBe(false)
    expect(isDisputableBookingStatus('completed')).toBe(false)
  })

  it('identifie les litiges ouverts et normalise la description', () => {
    expect(isOpenDisputeStatus('OPEN')).toBe(true)
    expect(isOpenDisputeStatus('under_review')).toBe(true)
    expect(isOpenDisputeStatus('RESOLVED_SENDER')).toBe(false)
    expect(normalizeDisputeDescription('  Texte   avec\nespaces  ')).toBe(
      'Texte avec espaces'
    )
  })
})
