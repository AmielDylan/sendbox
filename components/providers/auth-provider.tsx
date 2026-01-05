'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/shared/db/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { createProfile } from '@/types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { setUser, setProfile, setLoading, setInitialized, clear, user } = useAuthStore()
  const listenerSetup = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Initialisation: récupérer session et profil
    const initAuth = async () => {
      setLoading(true) // Marquer comme en cours de chargement
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Récupérer le profil
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) setProfile(createProfile(profile))
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    // Init auth immédiatement
    initAuth()

    // Éviter double setup du listener
    if (!listenerSetup.current) {
      listenerSetup.current = true

      // Listener auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event)

          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user) {
              setUser(session.user)

              // Récupérer profil à jour
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

              if (profile) setProfile(createProfile(profile))
            }

            // Invalider queries React Query
            queryClient.invalidateQueries()
          } else if (event === 'SIGNED_OUT') {
            clear()
            queryClient.clear()
          }
        }
      )

      return () => {
        subscription.unsubscribe()
        listenerSetup.current = false
      }
    }
  }, [])

  // Écouter changement user ID pour détection multi-tab
  useEffect(() => {
    const currentUserId = user?.id
    const storedUserId = localStorage.getItem('current_user_id')

    if (currentUserId && currentUserId !== storedUserId) {
      queryClient.clear()
      localStorage.setItem('current_user_id', currentUserId)
    } else if (!currentUserId && storedUserId) {
      queryClient.clear()
      localStorage.removeItem('current_user_id')
    }
  }, [user?.id, queryClient])

  return <>{children}</>
}
