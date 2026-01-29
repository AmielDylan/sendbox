import { describe, it, expect } from 'vitest'
import { signOut } from '@/lib/core/auth/actions'

/**
 * Tests pour la déconnexion utilisateur (signOut)
 */
describe('signOut', () => {
  it('déconnecte un utilisateur avec succès', async () => {
    // signOut() appelle redirect() qui lance une erreur (comportement Next.js normal)
    await expect(signOut()).rejects.toThrow('NEXT_REDIRECT')
  })
})
