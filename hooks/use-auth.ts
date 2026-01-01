/**
 * Hook React pour l'authentification côté client
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from "@/lib/shared/db/client"
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { useQueryClient } from '@tanstack/react-query'

interface UseAuthReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Stocker l'ID utilisateur dans localStorage pour détecter les changements
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Nettoyer l'ancienne clé de storage si elle existe (migration)
    const oldKey = 'supabase.auth.token'
    if (localStorage.getItem(oldKey)) {
      console.log('Removing old storage key:', oldKey)
      localStorage.removeItem(oldKey)
    }

    const currentUserId = user?.id
    const storedUserId = localStorage.getItem('current_user_id')

    if (currentUserId && currentUserId !== storedUserId) {
      // Nouvel utilisateur détecté, nettoyer le cache
      console.log('New user detected, clearing cache')
      queryClient.clear()
      localStorage.setItem('current_user_id', currentUserId)
    } else if (!currentUserId && storedUserId) {
      // Déconnexion détectée
      console.log('User logged out, clearing cache')
      queryClient.clear()
      localStorage.removeItem('current_user_id')
    }
  }, [user?.id, queryClient])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    let retryAttempted = false

    // Récupérer l'utilisateur actuel
    const getUser = async () => {
      try {
        // Timeout de sécurité uniquement pour la première tentative
        if (!retryAttempted && !timeoutId) {
          timeoutId = setTimeout(() => {
            if (mounted && !retryAttempted) {
              console.warn('Auth loading timeout - setting loading to false')
              retryAttempted = true
              setLoading(false)
            }
          }, 5000) // 5 secondes max
        }

        // Utiliser getSession au lieu de getUser pour forcer la lecture depuis les cookies
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          console.error('Session error:', sessionError)
          setLoading(false)
          return
        }

        const currentUser = session?.user ?? null

        console.log('useAuth - getUser:', {
          hasSession: !!session,
          hasUser: !!currentUser,
          userId: currentUser?.id
        })

        if (currentUser) {
          setUser(currentUser)

          // Récupérer le profil
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          console.log('useAuth - profile fetch:', {
            hasProfile: !!profileData,
            error: profileError?.message,
            profileId: profileData?.id
          })

          if (!mounted) return

          if (profileError) {
            console.error('Profile fetch error:', profileError)
          } else if (profileData) {
            setProfile(profileData as Profile)
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        if (!mounted) return
        console.error('Unexpected auth error:', error)
      } finally {
        if (mounted) {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          setLoading(false)
        }
      }
    }

    getUser()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)

      if (!mounted) return

      // Ignorer certains événements qui ne nécessitent pas de mise à jour
      if (event === 'TOKEN_REFRESHED') {
        return
      }

      try {
        if (session?.user) {
          // Ne mettre à jour que si l'utilisateur a changé
          const hasUserChanged = !user || user.id !== session.user.id

          setUser(session.user)

          // Récupérer le profil seulement si nécessaire
          if (hasUserChanged || !profile) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (!mounted) return

            if (profileError) {
              console.error('Profile fetch error on auth change:', profileError)
            } else if (profileData) {
              setProfile(profileData as Profile)
            }

            // Invalider les queries seulement si l'utilisateur a changé
            if (hasUserChanged) {
              queryClient.invalidateQueries()
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Ne nettoyer que lors d'un vrai sign out
          setUser(null)
          setProfile(null)
          queryClient.clear()
        }
      } catch (error) {
        if (!mounted) return
        console.error('Unexpected error in auth state change:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  // Fonction pour recharger manuellement l'utilisateur et le profil
  const refetch = useCallback(async () => {
    try {
      // Utiliser getSession pour forcer la lecture depuis les cookies
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user ?? null

      if (currentUser) {
        setUser(currentUser)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (profileData) {
          setProfile(profileData as Profile)
        }

        // Invalider toutes les queries pour forcer le rafraîchissement
        queryClient.invalidateQueries()
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Refetch error:', error)
    }
  }, [supabase, queryClient])

  // Écouter les événements personnalisés de changement d'authentification
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Custom auth change event received')
      refetch()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-change', handleAuthChange)
      return () => window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [refetch])

  const signOut = useCallback(async () => {
    try {
      // Nettoyer d'abord l'état local
      setUser(null)
      setProfile(null)
      setLoading(false)

      // Nettoyer le cache des queries
      queryClient.clear()

      // Nettoyer le localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('current_user_id')
      }

      // Appeler signOut côté client pour nettoyer les cookies et la session
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [supabase, queryClient])

  return {
    user,
    profile,
    loading,
    signOut,
    refetch,
  }
}

