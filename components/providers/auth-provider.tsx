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
  const supabaseRef = useRef(createClient())


  useEffect(() => {
    const supabase = supabaseRef.current

    const fetchProfileWithRetry = async (
      userId: string,
      retries = 3,
      delay = 2000,
      timeoutMs = 12000
    ) => {
      let lastError: unknown = null

      for (let i = 0; i < retries; i++) {
        try {
          const { data: profile, error } = await Promise.race([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single(),
            new Promise(resolve =>
              setTimeout(
                () => resolve({ data: null, error: new Error('Profile query timeout') }),
                timeoutMs
              )
            )
          ]) as any

          if (!error && profile) {
            return profile
          }

          lastError = error
        } catch (err) {
          lastError = err
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }

      if (lastError) {
        console.warn('[AuthProvider] Profile fetch failed after retries:', lastError)
      }

      return null
    }

    // Initialisation: récupérer session et profil
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Récupérer le profil avec retry
          const profile = await fetchProfileWithRetry(session.user.id)
          if (profile) {
            setProfile(createProfile(profile))
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
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
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            if (session?.user) {
              setUser(session.user)

              // Récupérer profil à jour avec retry
              const profile = await fetchProfileWithRetry(session.user.id)
              if (profile) {
                setProfile(createProfile(profile))
              }
            }

            // Invalider seulement les queries pertinentes (pas toutes!)
            // Évite boucle infinie avec onAuthStateChange
            queryClient.invalidateQueries({ queryKey: ['user'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
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
