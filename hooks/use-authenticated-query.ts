/**
 * Hook centralisé pour les requêtes nécessitant une authentification
 *
 * Avantages:
 * - Gère automatiquement la session (pas besoin de getSession dans chaque query)
 * - Timeout intelligent avec AbortController
 * - Retry automatique avec backoff
 * - Erreurs standardisées
 * - Pas de double-fetch de session
 */

import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'
import { useAuth } from '@/components/providers/optimized-auth-provider'

export interface AuthenticatedQueryOptions<TData, TError = Error> extends Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
> {
  /**
   * Timeout en millisecondes (défaut: 8000ms = 8 secondes)
   */
  timeout?: number

  /**
   * Si true, la requête ne s'exécute que si l'utilisateur est authentifié
   * Si false, la requête s'exécute même sans auth (défaut: true)
   */
  requireAuth?: boolean
}

/**
 * Erreur personnalisée pour les timeouts
 */
export class QueryTimeoutError extends Error {
  constructor(
    message: string,
    public readonly duration: number
  ) {
    super(message)
    this.name = 'QueryTimeoutError'
  }
}

/**
 * Erreur personnalisée pour l'absence d'authentification
 */
export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required')
    this.name = 'AuthenticationRequiredError'
  }
}

/**
 * Hook pour exécuter une requête authentifiée avec timeout
 */
export function useAuthenticatedQuery<TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: (userId: string, abortSignal: AbortSignal) => Promise<TData>,
  options: AuthenticatedQueryOptions<TData, TError> = {}
): UseQueryResult<TData, TError> {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const {
    timeout = 8000,
    requireAuth = true,
    enabled = true,
    ...restOptions
  } = options

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      // Vérifier l'authentification
      if (requireAuth && !isAuthenticated) {
        throw new AuthenticationRequiredError()
      }

      if (!user?.id) {
        throw new AuthenticationRequiredError()
      }

      // Créer un AbortController pour le timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      try {
        // Exécuter la requête avec le signal d'abort
        const result = await queryFn(user.id, controller.signal)
        return result
      } catch (error) {
        // Gérer les erreurs d'abort comme des timeouts
        if ((error as Error).name === 'AbortError') {
          throw new QueryTimeoutError(
            `Query timeout after ${timeout}ms`,
            timeout
          )
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    },
    // Désactiver la requête si auth est en cours de chargement ou si requireAuth et pas authentifié
    enabled: enabled && !isAuthLoading && (!requireAuth || isAuthenticated),
    ...restOptions,
  })
}

/**
 * Version sans authentification requise (pour les queries publiques)
 */
export function usePublicQuery<TData = unknown, TError = Error>(
  queryKey: unknown[],
  queryFn: (abortSignal: AbortSignal) => Promise<TData>,
  options: Omit<AuthenticatedQueryOptions<TData, TError>, 'requireAuth'> = {}
): UseQueryResult<TData, TError> {
  const { timeout = 8000, enabled = true, ...restOptions } = options

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      // Créer un AbortController pour le timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      try {
        const result = await queryFn(controller.signal)
        return result
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          throw new QueryTimeoutError(
            `Query timeout after ${timeout}ms`,
            timeout
          )
        }
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    },
    enabled,
    ...restOptions,
  })
}

/**
 * Helper pour créer une requête Supabase avec support du signal d'abort
 */
export async function queryWithAbort<T>(
  queryBuilder: any,
  signal: AbortSignal
): Promise<T> {
  // Supabase ne supporte pas nativement AbortSignal, donc on wrappe
  return new Promise((resolve, reject) => {
    // Listener pour l'abort
    const onAbort = () => {
      reject(new Error('AbortError'))
    }

    if (signal.aborted) {
      reject(new Error('AbortError'))
      return
    }

    signal.addEventListener('abort', onAbort)

    // Exécuter la requête
    queryBuilder
      .then((result: any) => {
        signal.removeEventListener('abort', onAbort)

        if (result.error) {
          reject(result.error)
        } else {
          resolve(result.data as T)
        }
      })
      .catch((error: Error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      })
  })
}

/**
 * Exemple d'utilisation:
 *
 * ```typescript
 * const { data, isLoading, error } = useAuthenticatedQuery(
 *   QUERY_KEYS.userBookings(userId, 'pending'),
 *   async (userId, signal) => {
 *     const supabase = createClient()
 *     return queryWithAbort(
 *       supabase
 *         .from('bookings')
 *         .select('*')
 *         .eq('sender_id', userId)
 *         .eq('status', 'pending'),
 *       signal
 *     )
 *   },
 *   {
 *     timeout: 5000, // 5 secondes
 *     staleTime: QUERY_CONFIG.LISTS.staleTime,
 *     gcTime: QUERY_CONFIG.LISTS.gcTime,
 *   }
 * )
 * ```
 */
