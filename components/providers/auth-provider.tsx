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

    // Initialisation: récupérer session et profil
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Récupérer le profil avec timeout de 10s (augmenté) + logs détaillés
          const startTime = Date.now()
          try {
            console.log('[AuthProvider] Fetching profile for user:', session.user.id)

            const { data: profile, error: profileError } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile query timeout')), 10000)
              )
            ]) as any

            const elapsed = Date.now() - startTime
            console.log(`[AuthProvider] Profile query took ${elapsed}ms`)

            if (profile) {
              console.log('[AuthProvider] Profile loaded successfully:', profile.id)
              setProfile(createProfile(profile))
            } else if (profileError) {
              console.error('[AuthProvider] Profile query error:', profileError)
            }
          } catch (profileFetchError) {
            const elapsed = Date.now() - startTime
            console.error(`[AuthProvider] Profile fetch failed after ${elapsed}ms:`, profileFetchError)
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

              // Récupérer profil à jour avec timeout de 10s (augmenté) + logs détaillés
              const startTime = Date.now()
              try {
                console.log('[AuthProvider] onAuthStateChange - Fetching profile for:', session.user.id)

                const { data: profile, error: profileError } = await Promise.race([
                  supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single(),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile query timeout')), 10000)
                  )
                ]) as any

                const elapsed = Date.now() - startTime
                console.log(`[AuthProvider] onAuthStateChange - Profile query took ${elapsed}ms`)

                if (profile) {
                  console.log('[AuthProvider] onAuthStateChange - Profile loaded:', profile.id)
                  setProfile(createProfile(profile))
                } else if (profileError) {
                  console.error('[AuthProvider] onAuthStateChange - Profile error:', profileError)
                }
              } catch (profileFetchError) {
                const elapsed = Date.now() - startTime
                console.error(`[AuthProvider] onAuthStateChange - Profile fetch failed after ${elapsed}ms:`, profileFetchError)
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
