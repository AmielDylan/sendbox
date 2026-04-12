'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import type { SubscriptionInfo } from '@/lib/core/subscriptions/utils'

interface UseSubscriptionStatusOptions {
  initialData?: SubscriptionInfo
  staleTime?: number
  gcTime?: number
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
}

async function fetchSubscriptionStatus(): Promise<SubscriptionInfo> {
  const response = await fetch('/api/subscriptions/status', {
    credentials: 'include',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload) {
    throw new Error('Impossible de récupérer le statut de l’abonnement.')
  }

  return payload as SubscriptionInfo
}

export function useSubscriptionStatus(
  options: UseSubscriptionStatusOptions = {}
) {
  const { user, loading } = useAuth()
  const enabled =
    isFeatureEnabled('SUBSCRIPTION_ENABLED') && Boolean(user?.id) && !loading

  return useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: fetchSubscriptionStatus,
    enabled,
    initialData: options.initialData,
    placeholderData: previous => previous ?? options.initialData,
    staleTime: options.staleTime ?? 300_000,
    gcTime: options.gcTime ?? 1_800_000,
    refetchOnMount: options.refetchOnMount ?? false,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
  })
}
