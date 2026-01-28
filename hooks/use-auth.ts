/**
 * Hook React pour l'authentification côté client
 * Utilise Zustand store pour état centralisé et persistant
 */

'use client'

import {
  useAuthStore,
  selectUser,
  selectProfile,
  selectLoading,
} from '@/lib/stores/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/shared/db/client'
import { signOutServer } from '@/lib/core/auth/actions'
import { createProfile } from '@/types'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const queryClient = useQueryClient()
  const user = useAuthStore(selectUser)
  const profile = useAuthStore(selectProfile)
  const loading = useAuthStore(selectLoading)
  const clear = useAuthStore(state => state.clear)

  const signOut = async () => {
    try {
      // Nettoyer l'état Zustand
      clear()

      // Nettoyer le cache React Query
      queryClient.clear()

      // Nettoyer localStorage
      localStorage.removeItem('current_user_id')

      // Déconnexion serveur
      await signOutServer()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refetch = async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Mettre à jour le store directement
        useAuthStore.setState({ user: session.user })

        // Récupérer le profil à jour
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          useAuthStore.setState({ profile: createProfile(profile) })
        }
      }

      // Invalider toutes les queries
      queryClient.invalidateQueries()
    } catch (error) {
      console.error('Refetch error:', error)
    }
  }

  return { user, profile, loading, signOut, refetch }
}
