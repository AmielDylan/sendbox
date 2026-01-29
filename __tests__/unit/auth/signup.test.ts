import { describe, it, expect } from 'vitest'
import { signUp } from '@/lib/core/auth/actions'
import type { RegisterInput } from '@/lib/core/auth/validations'

/**
 * Tests pour l'inscription utilisateur (signUp)
 */
describe('signUp', () => {
  const validSignupData: RegisterInput = {
    email: 'newuser@test.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    firstname: 'John',
    lastname: 'Doe',
    phone: '+33612345678',
    terms: true,
  }

  it('crée un utilisateur avec des données valides', async () => {
    const result = await signUp(validSignupData)

    // Le résultat ne devrait pas avoir d'erreur
    expect(result).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('rejette un email invalide', async () => {
    const invalidData = {
      ...validSignupData,
      email: 'invalid-email',
    }

    const result = await signUp(invalidData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('email')
  })

  it('rejette un mot de passe trop court', async () => {
    const invalidData = {
      ...validSignupData,
      password: '123',
    }

    const result = await signUp(invalidData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('password')
  })

  it('rejette un prénom vide', async () => {
    const invalidData = {
      ...validSignupData,
      firstname: '',
    }

    const result = await signUp(invalidData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('firstname')
  })

  it('rejette un nom vide', async () => {
    const invalidData = {
      ...validSignupData,
      lastname: '',
    }

    const result = await signUp(invalidData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('lastname')
  })

  it('rejette un numéro de téléphone invalide', async () => {
    const invalidData = {
      ...validSignupData,
      phone: '123',
    }

    const result = await signUp(invalidData)

    expect(result.error).toBeDefined()
    expect(result.field).toBe('phone')
  })

  it('gère les emails en majuscules', async () => {
    const uppercaseData = {
      ...validSignupData,
      email: 'NEWUSER@TEST.COM',
    }

    const result = await signUp(uppercaseData)

    // Devrait fonctionner car l'email sera normalisé
    expect(result).toBeDefined()
  })
})
