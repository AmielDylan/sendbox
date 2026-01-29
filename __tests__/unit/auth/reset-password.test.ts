import { describe, it, expect } from 'vitest'
import { requestPasswordReset } from '@/lib/core/auth/actions'
import type { ResetPasswordRequestInput } from '@/lib/core/auth/validations'

/**
 * Tests pour la demande de réinitialisation de mot de passe
 */
describe('requestPasswordReset', () => {
  const validResetData: ResetPasswordRequestInput = {
    email: 'user@test.com',
  }

  it('envoie un email de réinitialisation avec un email valide', async () => {
    const result = await requestPasswordReset(validResetData)

    expect(result).toBeDefined()
    expect(result.error).toBeUndefined()
  })

  it('rejette un email invalide', async () => {
    const invalidData = {
      email: 'invalid-email',
    }

    const result = await requestPasswordReset(invalidData)

    expect(result.error).toBeDefined()
  })

  it('accepte les emails en majuscules', async () => {
    const uppercaseData = {
      email: 'USER@TEST.COM',
    }

    const result = await requestPasswordReset(uppercaseData)

    // Devrait fonctionner car l'email sera normalisé
    expect(result).toBeDefined()
  })
})
