/**
 * Configuration optimisée pour React Query basée sur les meilleures pratiques Supabase
 *
 * Principes clés:
 * - Stale time adapté par type de données (30s-5min)
 * - Garbage collection time généreux (30min)
 * - Retry intelligent avec backoff exponentiel
 * - Timeout raisonnable (10s max)
 * - Refetch on window focus désactivé (sauf exceptions)
 */

import { QueryClient, QueryClientConfig } from '@tanstack/react-query'

/**
 * Types de données et leurs configurations recommandées
 */
export const QUERY_CONFIG = {
  // Données utilisateur (profil, paramètres) - changent rarement
  USER_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },

  // Listes (annonces, réservations) - mises à jour fréquentes
  LISTS: {
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  },

  // Conversations et notifications - temps réel via Realtime
  REALTIME: {
    staleTime: 60 * 1000, // 1 minute (le realtime met à jour)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false, // Désactivé - le realtime gère
  },

  // Données de session/auth - critiques
  AUTH: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: true, // Important pour détecter les changements d'auth
    retry: 3,
  },

  // Données statiques (types, catégories) - changent très rarement
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
  },
} as const

/**
 * Clés de requêtes standardisées pour une invalidation précise
 */
export const QUERY_KEYS = {
  // Auth
  auth: ['auth'] as const,
  session: () => [...QUERY_KEYS.auth, 'session'] as const,
  profile: (userId?: string) =>
    [...QUERY_KEYS.auth, 'profile', userId] as const,

  // Annonces
  announcements: ['announcements'] as const,
  userAnnouncements: (userId: string, status?: string) =>
    [...QUERY_KEYS.announcements, 'user', userId, status] as const,
  announcementDetail: (id: string) =>
    [...QUERY_KEYS.announcements, 'detail', id] as const,

  // Réservations
  bookings: ['bookings'] as const,
  userBookings: (userId: string, status?: string) =>
    [...QUERY_KEYS.bookings, 'user', userId, status] as const,
  bookingDetail: (id: string) =>
    [...QUERY_KEYS.bookings, 'detail', id] as const,
  pendingRequests: () => [...QUERY_KEYS.bookings, 'pending'] as const,

  // Messages
  messages: ['messages'] as const,
  conversations: () => [...QUERY_KEYS.messages, 'conversations'] as const,
  conversationMessages: (bookingId: string) =>
    [...QUERY_KEYS.messages, 'conversation', bookingId] as const,

  // Notifications
  notifications: ['notifications'] as const,
  unreadCount: () => [...QUERY_KEYS.notifications, 'unread-count'] as const,
} as const

/**
 * Fonction de retry intelligente avec backoff exponentiel
 */
export function retryWithBackoff(failureCount: number, error: any): boolean {
  // Ne pas retry les erreurs 4xx (erreurs client)
  if (error?.status >= 400 && error?.status < 500) {
    return false
  }

  // Maximum 3 tentatives
  if (failureCount >= 3) {
    return false
  }

  return true
}

/**
 * Calcul du délai de retry avec backoff exponentiel
 */
export function getRetryDelay(attemptIndex: number): number {
  // Backoff: 1s, 2s, 4s
  return Math.min(1000 * 2 ** attemptIndex, 4000)
}

/**
 * Configuration par défaut optimisée pour React Query
 */
export const defaultQueryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Temps avant que les données soient considérées comme "stale"
      // Par défaut 30 secondes - assez court pour rester à jour
      staleTime: 30 * 1000,

      // Temps avant garbage collection (suppression du cache)
      // 30 minutes - suffisant pour navigation normale
      gcTime: 30 * 60 * 1000,

      // Ne pas refetch automatiquement au focus
      // (sera géré manuellement pour les données critiques)
      refetchOnWindowFocus: false,

      // Ne pas refetch automatiquement à la reconnexion
      // (les données en cache restent valides)
      refetchOnReconnect: false,

      // Refetch au montage uniquement si stale
      refetchOnMount: true,

      // Retry configuration
      retry: retryWithBackoff,
      retryDelay: getRetryDelay,

      // Network mode: toujours essayer (même offline)
      // Les requêtes seront en attente jusqu'au retour en ligne
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry les mutations seulement pour les erreurs réseau
      retry: (failureCount, error: any) => {
        if (failureCount >= 2) return false
        if (error?.status >= 400 && error?.status < 500) return false
        return true
      },
      retryDelay: getRetryDelay,
      networkMode: 'offlineFirst',
    },
  },
}

/**
 * Création du QueryClient avec la configuration optimisée
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(defaultQueryClientConfig)
}

/**
 * Helper pour invalider intelligemment les queries liées à l'auth
 */
export function invalidateAuthQueries(
  queryClient: QueryClient,
  userId?: string
) {
  // Invalider seulement les données liées au profil utilisateur
  if (userId) {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(userId) })
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.userAnnouncements(userId),
    })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userBookings(userId) })
  }

  // Ne PAS invalider les conversations, notifications (gérées par Realtime)
  // Ne PAS invalider les détails (pas affectés par l'auth)
}

/**
 * Helper pour invalider les queries après une mutation
 */
export function invalidateAfterMutation(
  queryClient: QueryClient,
  type: 'announcement' | 'booking' | 'message' | 'profile',
  userId?: string
) {
  switch (type) {
    case 'announcement':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements })
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userAnnouncements(userId),
        })
      }
      break

    case 'booking':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookings })
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.userBookings(userId),
        })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingRequests() })
      break

    case 'message':
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications })
      break

    case 'profile':
      if (userId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(userId) })
      }
      break
  }
}
