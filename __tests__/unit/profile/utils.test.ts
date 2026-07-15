import { describe, expect, it } from 'vitest'
import { isProfileIdentityComplete } from '@/lib/core/profile/utils'

describe('profile utils', () => {
  describe('isProfileIdentityComplete', () => {
    it('accepte un profil avec prenom et nom renseignes', () => {
      expect(isProfileIdentityComplete('Alice', 'Dupont')).toBe(true)
    })

    it('rejette un profil sans prenom', () => {
      expect(isProfileIdentityComplete('', 'Dupont')).toBe(false)
    })

    it('rejette un profil sans nom', () => {
      expect(isProfileIdentityComplete('Alice', null)).toBe(false)
    })

    it('rejette les valeurs trop courtes ou uniquement composees d espaces', () => {
      expect(isProfileIdentityComplete(' A ', 'Dupont')).toBe(false)
      expect(isProfileIdentityComplete('Alice', '   ')).toBe(false)
    })
  })
})
