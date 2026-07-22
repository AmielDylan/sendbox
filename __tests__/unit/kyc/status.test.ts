import { describe, expect, it } from 'vitest'
import { resolveKycApiStatus, resolveKycStatus } from '@/lib/core/kyc/status'

describe('kyc status helpers', () => {
  it('priorise verification_status verified comme statut approuve', () => {
    expect(
      resolveKycStatus({
        verification_status: 'verified',
        kyc_status: 'pending',
      })
    ).toBe('approved')
  })

  it('priorise verification_status pending comme statut en cours', () => {
    expect(
      resolveKycStatus({
        verification_status: 'pending',
        kyc_status: 'incomplete',
      })
    ).toBe('pending')
  })

  it('priorise verification_status rejected comme statut rejete', () => {
    expect(
      resolveKycStatus({
        verification_status: 'rejected',
        kyc_status: 'approved',
      })
    ).toBe('rejected')
  })

  it('retombe sur kyc_status quand verification_status est absent', () => {
    expect(resolveKycStatus({ kyc_status: 'approved' })).toBe('approved')
    expect(resolveKycStatus({ kyc_status: 'incomplete' })).toBe('incomplete')
  })

  it('retourne null si aucun statut exploitable nest disponible', () => {
    expect(resolveKycStatus({})).toBeNull()
    expect(resolveKycStatus({ verification_status: 'none' })).toBeNull()
  })

  it('expose les libelles historiques attendus par api/kyc/status', () => {
    expect(resolveKycApiStatus({ verification_status: 'verified' })).toBe(
      'verified'
    )
    expect(resolveKycApiStatus({ kyc_status: 'approved' })).toBe('verified')
    expect(resolveKycApiStatus({ verification_status: 'pending' })).toBe(
      'pending'
    )
    expect(resolveKycApiStatus({ verification_status: 'rejected' })).toBe(
      'rejected'
    )
    expect(resolveKycApiStatus({ kyc_status: 'incomplete' })).toBe('none')
  })
})
