import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clear: () => void
}

export type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  profile: null,
  // ✅ true par défaut pour éviter les redirects prématurés avant l'hydratation + getSession()
  loading: true,
  initialized: false,
}

export const useAuthStore = create<AuthStore>()(
  persist(
    set => ({
      ...initialState,

      setUser: user => set({ user }),
      setProfile: profile => set({ profile }),
      setLoading: loading => set({ loading }),
      setInitialized: initialized => set({ initialized }),

      clear: () =>
        set({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
        }),
    }),
    {
      name: 'sendbox-auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        state?.setInitialized(true)
      },
      partialize: state => ({
        // Persister seulement user et profile, pas loading/initialized
        user: state.user,
        profile: state.profile,
      }),
    }
  )
)

// Selectors optimisés pour éviter re-renders
export const selectUser = (state: AuthStore) => state.user
export const selectProfile = (state: AuthStore) => state.profile
export const selectLoading = (state: AuthStore) => state.loading
export const selectIsAuthenticated = (state: AuthStore) => !!state.user
