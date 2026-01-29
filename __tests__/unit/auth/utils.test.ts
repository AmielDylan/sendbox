import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, resetPasswordRequestSchema } from '@/lib/core/auth/validations'

/**
 * Tests pour les utilitaires et validations d'authentification
 */
describe('Auth Validations', () => {
  describe('registerSchema', () => {
    it('valide des données d inscription correctes', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejette un email invalide', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('rejette un mot de passe faible', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('valide des données de connexion correctes', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejette un email invalide', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        rememberMe: false,
      }

      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordRequestSchema', () => {
    it('valide un email correct', () => {
      const validData = {
        email: 'test@example.com',
      }

      const result = resetPasswordRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('rejette un email invalide', () => {
      const invalidData = {
        email: 'not-an-email',
      }

      const result = resetPasswordRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
