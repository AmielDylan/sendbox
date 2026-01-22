'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/shared/db/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { createProfile } from '@/types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const { setUser, setProfile, setInitialized, clear, user } = useAuthStore()
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

    const applySession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (session?.user) {
        setUser(session.user)

        const profile = await fetchProfileWithRetry(session.user.id)
        if (profile) {
          setProfile(createProfile(profile))
        } else {
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    }

    const syncSession = async (retries = 0, delayMs = 300) => {
      let session = null

      for (let attempt = 0; attempt <= retries; attempt++) {
        const { data } = await supabase.auth.getSession()
        session = data.session

        if (session?.user || attempt === retries) {
          break
        }

        await new Promise(resolve => setTimeout(resolve, delayMs))
      }

      await applySession(session)
    }

    // Initialisation: récupérer session et profil
    const initAuth = async () => {
      try {
        await syncSession()
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

      const handleAuthChange = async () => {
        try {
          await syncSession(2)
          queryClient.invalidateQueries()
        } catch (error) {
          console.error('[AuthProvider] Auth change sync failed:', error)
        }
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('auth-change', handleAuthChange)
      }

      // Listener auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            await applySession(session || null)

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
        if (typeof window !== 'undefined') {
          window.removeEventListener('auth-change', handleAuthChange)
        }
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
