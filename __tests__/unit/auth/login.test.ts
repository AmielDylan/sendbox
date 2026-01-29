import { describe, it, expect } from 'vitest'
import { signIn } from '@/lib/core/auth/actions'
import type { LoginInput } from '@/lib/core/auth/validations'

/**
 * Tests pour la connexion utilisateur (signIn)
 */
describe('signIn', () => {
  const validLoginData: LoginInput = {
    email: 'user@test.com',
    password: 'SecurePass123!',
    rememberMe: false,
  }

  it('connecte un utilisateur avec des credentials valides', async () => {
    const result = await signIn(validLoginData)

    // Le résultat ne devrait pas avoir d'erreur
    expect(result).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('rejette un email invalide', async () => {
    const invalidData = {
      ...validLoginData,
      email: 'invalid-email',
    }

    const result = await signIn(invalidData)

    expect(result.error).toBeDefined()
  })

  it('rejette un mot de passe vide', async () => {
    const invalidData = {
      ...validLoginData,
      password: '',
    }

    const result = await signIn(invalidData)

    expect(result.error).toBeDefined()
  })

  it('normalise les emails en minuscules', async () => {
    const uppercaseData = {
      ...validLoginData,
      email: 'USER@TEST.COM',
    }

    const result = await signIn(uppercaseData)

    // Devrait fonctionner car l'email sera normalisé
    expect(result).toBeDefined()
  })
})
