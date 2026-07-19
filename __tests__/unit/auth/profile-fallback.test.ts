import { describe, expect, it } from 'vitest'
import {
  isExpectedProfileFallbackError,
  isExpectedProfileUpdateMiss,
} from '@/lib/core/auth/profile-fallback'

describe('isExpectedProfileFallbackError', () => {
  it('accepte les erreurs attendues du fallback de profil', () => {
    expect(isExpectedProfileFallbackError({ code: '23503' })).toBe(true)
    expect(isExpectedProfileFallbackError({ code: '23505' })).toBe(true)
  })

  it('rejette les erreurs inattendues', () => {
    expect(isExpectedProfileFallbackError({ code: 'PGRST116' })).toBe(false)
    expect(isExpectedProfileFallbackError({ message: 'Network error' })).toBe(
      false
    )
    expect(isExpectedProfileFallbackError(null)).toBe(false)
  })

  it("accepte les absences de profil attendues pendant l'inscription", () => {
    expect(isExpectedProfileUpdateMiss({ code: 'PGRST116' })).toBe(true)
    expect(isExpectedProfileUpdateMiss({ error: 'Record not found' })).toBe(
      true
    )
    expect(isExpectedProfileUpdateMiss({ message: 'Record not found' })).toBe(
      true
    )
  })

  it('rejette les erreurs update inattendues', () => {
    expect(isExpectedProfileUpdateMiss({ code: '42501' })).toBe(false)
    expect(isExpectedProfileUpdateMiss({ message: 'Permission denied' })).toBe(
      false
    )
    expect(isExpectedProfileUpdateMiss(undefined)).toBe(false)
  })
})
