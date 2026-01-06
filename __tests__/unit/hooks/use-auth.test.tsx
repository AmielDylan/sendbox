/**
 * Unit tests for use-auth hook
 * Tests the auth hook that uses Zustand store
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import { createProfile } from '@/types'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

// Mock createClient
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
}

vi.mock('@/lib/shared/db/client', () => ({
  createClient: () => mockSupabase,
}))

// Mock signOutServer
vi.mock('@/lib/core/auth/actions', () => ({
  signOutServer: vi.fn(),
}))

// Mock QueryClient
const mockQueryClient = {
  clear: vi.fn(),
  invalidateQueries: vi.fn(),
}

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}))

describe('useAuth Hook', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  const mockProfile: Profile = createProfile({
    id: 'user-123',
    email: 'test@example.com',
    firstname: 'John',
    lastname: 'Doe',
    role: 'user',
    phone: '+33612345678',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Zustand store
    useAuthStore.setState({
      user: null,
      profile: null,
      loading: false,
    })
  })

  afterEach(() => {
    // Clean up localStorage
    localStorage.clear()
  })

  describe('Initial State', () => {
    test('returns null user and profile when not authenticated', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    test('returns user and profile from Zustand store when available', () => {
      // Set initial state
      useAuthStore.setState({
        user: mockUser,
        profile: mockProfile,
        loading: false,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.loading).toBe(false)
    })

    test('shows loading state correctly', () => {
      useAuthStore.setState({
        user: null,
        profile: null,
        loading: true,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('signOut', () => {
    test('clears user and profile from store', async () => {
      useAuthStore.setState({
        user: mockUser,
        profile: mockProfile,
        loading: false,
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.profile).toBeNull()
    })

    test('clears React Query cache', async () => {
      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(mockQueryClient.clear).toHaveBeenCalled()
    })

    test('clears localStorage current_user_id', async () => {
      localStorage.setItem('current_user_id', 'user-123')

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signOut()
      })

      expect(localStorage.getItem('current_user_id')).toBeNull()
    })

    test('handles signOut errors gracefully', async () => {
      const signOutServer = await import('@/lib/core/auth/actions')
      vi.mocked(signOutServer.signOutServer).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth())

      // Should not throw
      await act(async () => {
        await expect(result.current.signOut()).resolves.not.toThrow()
      })
    })
  })

  describe('refetch', () => {
    test('updates user and profile from Supabase', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: mockUser,
            access_token: 'token',
          },
        },
        error: null,
      })

      const fromMock = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockProfile,
                error: null,
              })
            ),
          })),
        })),
      }))

      mockSupabase.from = fromMock

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        const state = useAuthStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.profile).toEqual(mockProfile)
      })
    })

    test('invalidates React Query cache after refetch', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: mockUser,
            access_token: 'token',
          },
        },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.refetch()
      })

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled()
    })

    test('handles refetch errors gracefully', async () => {
      mockSupabase.auth.getSession.mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth())

      // Should not throw
      await act(async () => {
        await expect(result.current.refetch()).resolves.not.toThrow()
      })
    })
  })

  describe('Selectors', () => {
    test('selectUser returns user from store', () => {
      useAuthStore.setState({
        user: mockUser,
        profile: null,
        loading: false,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toEqual(mockUser)
    })

    test('selectProfile returns profile from store', () => {
      useAuthStore.setState({
        user: mockUser,
        profile: mockProfile,
        loading: false,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.profile).toEqual(mockProfile)
    })

    test('selectLoading returns loading state from store', () => {
      useAuthStore.setState({
        user: null,
        profile: null,
        loading: true,
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
    })
  })

  describe('Store Updates', () => {
    test('hook reacts to store updates', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.user).toBeNull()

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          profile: mockProfile,
          loading: false,
        })
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })

    test('hook reacts to loading state changes', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(false)

      act(() => {
        useAuthStore.setState({ loading: true })
      })

      expect(result.current.loading).toBe(true)

      act(() => {
        useAuthStore.setState({ loading: false })
      })

      expect(result.current.loading).toBe(false)
    })
  })
})
