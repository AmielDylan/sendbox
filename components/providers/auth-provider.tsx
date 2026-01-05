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

          // Récupérer le profil avec timeout de 5s
          try {
            const { data: profile, error: profileError } = await Promise.race([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile query timeout')), 5000)
              )
            ]) as any

            if (profile) {
              setProfile(createProfile(profile))
            } else if (profileError) {
              console.error('Profile query error:', profileError)
            }
          } catch (profileFetchError) {
            console.error('Profile fetch failed:', profileFetchError)
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

              // Récupérer profil à jour avec timeout de 5s
              try {
                const { data: profile, error: profileError } = await Promise.race([
                  supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single(),
                  new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile query timeout')), 5000)
                  )
                ]) as any

                if (profile) {
                  setProfile(createProfile(profile))
                } else if (profileError) {
                  console.error('Profile error from auth change:', profileError)
                }
              } catch (profileFetchError) {
                console.error('Profile fetch from auth change failed:', profileFetchError)
              }
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
