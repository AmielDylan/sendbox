/**
 * AuthProvider optimisé selon les meilleures pratiques Supabase
 *
 * Principes clés:
 * - Un seul listener onAuthStateChange pour toute l'app
 * - Invalidation ciblée des queries (pas de clear global)
 * - Gestion robuste des erreurs avec fallback
 * - Synchronisation multi-onglets via BroadcastChannel
 * - Pas de timeout agressif sur le fetch du profil
 */

'use client'

import {  createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/shared/db/client'
import { useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { QUERY_KEYS, invalidateAuthQueries } from '@/lib/shared/query/config'

export interface Profile {
  id: string
  firstname: string | null
  lastname: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  bio: string | null
  rating: number | null
  rating_count?: number | null
  verified?: boolean
  created_at: string
  updated_at: string
  // Champs supplémentaires de la DB
  [key: string]: any
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  refetchProfile: async () => {},
})

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const queryClient = useQueryClient()
  const supabase = createClient()

  // Ref pour éviter les double-fetches
  const isFetchingProfile = useRef(false)
  const lastUserId = useRef<string | null>(null)

  /**
   * Fetch du profil utilisateur avec gestion d'erreur robuste
   */
  const fetchProfile = useCallback(async (userId: string) => {
    // Éviter les double-fetches
    if (isFetchingProfile.current) {
      return
    }

    // Si c'est le même utilisateur, ne pas refetch
    if (lastUserId.current === userId && profile?.id === userId) {
      return
    }

    isFetchingProfile.current = true
    lastUserId.current = userId

    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        // Si le profil n'existe pas, ce n'est pas une erreur critique
        if (profileError.code === 'PGRST116') {
          console.warn('[Auth] Profile not found for user:', userId)
          setProfile(null)
          setError(null)
        } else {
          console.error('[Auth] Error fetching profile:', profileError)
          setError(new Error('Failed to load profile'))
        }
      } else {
        setProfile(data as Profile)
        setError(null)
      }
    } catch (err) {
      console.error('[Auth] Unexpected error fetching profile:', err)
      setError(err as Error)
    } finally {
      isFetchingProfile.current = false
    }
  }, [supabase, profile])

  /**
   * Fonction publique pour refetch le profil
   */
  const refetchProfile = useCallback(async () => {
    if (user?.id) {
      lastUserId.current = null // Force refetch
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  /**
   * Initialisation: récupérer la session au montage
   */
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setIsLoading(true)

        // Récupérer la session depuis le storage
        const { data: { session: initialSession }, error: sessionError } =
          await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('[Auth] Error getting session:', sessionError)
          setError(sessionError)
          setSession(null)
          setUser(null)
          setProfile(null)
        } else {
          setSession(initialSession)
          setUser(initialSession?.user ?? null)

          // Fetch profil si on a un utilisateur
          if (initialSession?.user?.id) {
            await fetchProfile(initialSession.user.id)
          }
        }
      } catch (err) {
        console.error('[Auth] Error initializing auth:', err)
        setError(err as Error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [supabase, fetchProfile])

  /**
   * Écouter les changements d'état d'authentification
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] State change:', event, currentSession?.user?.id)

        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        // Gérer les différents événements
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (currentSession?.user?.id) {
              // Fetch le profil pour le nouvel utilisateur
              await fetchProfile(currentSession.user.id)

              // Invalider seulement les queries liées à cet utilisateur
              invalidateAuthQueries(queryClient, currentSession.user.id)
            }
            break

          case 'SIGNED_OUT':
            // Clear le profil
            setProfile(null)
            lastUserId.current = null

            // Clear seulement les queries auth (pas tout le cache!)
            queryClient.removeQueries({ queryKey: QUERY_KEYS.auth })
            queryClient.removeQueries({ queryKey: QUERY_KEYS.announcements })
            queryClient.removeQueries({ queryKey: QUERY_KEYS.bookings })
            queryClient.removeQueries({ queryKey: QUERY_KEYS.messages })
            queryClient.removeQueries({ queryKey: QUERY_KEYS.notifications })
            break

          case 'PASSWORD_RECOVERY':
            // Pas besoin de fetch le profil
            break

          default:
            console.log('[Auth] Unhandled event:', event)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, queryClient, fetchProfile])

  /**
   * Synchronisation multi-onglets via BroadcastChannel
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel('supabase-auth')

    channel.onmessage = (event) => {
      if (event.data.type === 'SIGNED_OUT') {
        console.log('[Auth] Multi-tab signout detected')
        // Forcer un refresh de la session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setSession(null)
            setUser(null)
            setProfile(null)
            lastUserId.current = null
          }
        })
      }
    }

    return () => {
      channel.close()
    }
  }, [supabase])

  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    error,
    refetchProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
