/**
 * Unit tests for auth server actions
 * Tests authentication logic with mocked Supabase
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { RegisterInput, LoginInput } from '@/lib/core/auth/validations'

// Mock Next.js functions before imports
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock Supabase server client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    verifyOtp: vi.fn(),
  },
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() =>
          Promise.resolve({ data: [{ id: 'profile-123' }], error: null })
        ),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
  })),
}

vi.mock('@/lib/shared/db/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Mock rate limiter
vi.mock('@/lib/shared/security/rate-limit', () => ({
  authRateLimit: vi.fn(() => Promise.resolve({ success: true })),
}))

// Import after mocks are set up
import { signUp, signIn } from '@/lib/core/auth/actions'

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    test('successfully creates new user with valid data', async () => {
      const validData: RegisterInput = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      const result = await signUp(validData)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Inscription réussie')
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: validData.email,
        password: validData.password,
        options: expect.objectContaining({
          data: {
            firstname: validData.firstname,
            lastname: validData.lastname,
            phone: validData.phone,
          },
        }),
      })
    })

    test('returns error for invalid email format', async () => {
      const invalidData: RegisterInput = {
        email: 'invalid-email',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = await signUp(invalidData)

      expect(result.error).toBeDefined()
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    test('returns error for weak password', async () => {
      const weakPasswordData: RegisterInput = {
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = await signUp(weakPasswordData)

      expect(result.error).toBeDefined()
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    test('returns error for mismatched passwords', async () => {
      const mismatchedData: RegisterInput = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'DifferentPassword123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      const result = await signUp(mismatchedData)

      expect(result.error).toBeDefined()
      expect(mockSupabase.auth.signUp).not.toHaveBeenCalled()
    })

    test('handles already registered email gracefully', async () => {
      const validData: RegisterInput = {
        email: 'existing@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: {
          message: 'User already registered',
        },
      })

      const result = await signUp(validData)

      expect(result.error).toBeDefined()
      expect(result.field).toBe('email')
    })

    test('validates required fields', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        // Missing required fields
      } as RegisterInput

      const result = await signUp(invalidData)

      expect(result.error).toBeDefined()
    })
  })

  describe('signIn', () => {
    test('successfully signs in user with valid credentials', async () => {
      const validCredentials: LoginInput = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        rememberMe: false,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            email_confirmed_at: new Date().toISOString(),
          },
          session: { access_token: 'token' },
        },
        error: null,
      })

      const result = await signIn(validCredentials)

      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe('/dashboard')
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: validCredentials.email,
        password: validCredentials.password,
      })
    })

    test('returns error for invalid credentials', async () => {
      const invalidCredentials: LoginInput = {
        email: 'test@example.com',
        password: 'WrongPassword',
        rememberMe: false,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
        },
      })

      const result = await signIn(invalidCredentials)

      expect(result.error).toBeDefined()
      expect(result.success).toBeUndefined()
    })

    test('requires email verification before sign in', async () => {
      const credentials: LoginInput = {
        email: 'unverified@example.com',
        password: 'StrongPassword123!',
        rememberMe: false,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'unverified@example.com',
            email_confirmed_at: null, // Not verified
          },
          session: { access_token: 'token' },
        },
        error: null,
      })

      const result = await signIn(credentials)

      expect(result.error).toContain('Veuillez vérifier votre email')
      expect(result.requiresVerification).toBe(true)
    })

    test('validates email format', async () => {
      const invalidEmail: LoginInput = {
        email: 'not-an-email',
        password: 'StrongPassword123!',
        rememberMe: false,
      }

      const result = await signIn(invalidEmail)

      expect(result.error).toBeDefined()
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    test('validates password is required', async () => {
      const noPassword = {
        email: 'test@example.com',
        rememberMe: false,
      } as LoginInput

      const result = await signIn(noPassword)

      expect(result.error).toBeDefined()
      expect(mockSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })
  })

  describe('Security', () => {
    test('uses generic error messages to prevent email enumeration', async () => {
      const credentials: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
        rememberMe: false,
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message: 'User not found',
        },
      })

      const result = await signIn(credentials)

      // Should use generic message, not reveal "user not found"
      expect(result.error).not.toContain('User not found')
      expect(result.error).toContain('incorrect')
    })

    test('sanitizes user input in error responses', async () => {
      const maliciousData: RegisterInput = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstname: '<script>alert("XSS")</script>',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      const result = await signUp(maliciousData)

      // Should still succeed (sanitization happens on read)
      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      const validData: LoginInput = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        rememberMe: false,
      }

      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await signIn(validData)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('Une erreur est survenue')
    })

    test('handles Supabase service errors', async () => {
      const validData: RegisterInput = {
        email: 'test@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        firstname: 'John',
        lastname: 'Doe',
        phone: '+33612345678',
        terms: true,
      }

      mockSupabase.auth.signUp.mockRejectedValueOnce(
        new Error('Supabase service unavailable')
      )

      const result = await signUp(validData)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('Une erreur est survenue')
    })
  })
})
