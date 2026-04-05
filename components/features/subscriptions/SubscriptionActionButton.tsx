'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  IconArrowRight,
  IconCreditCard,
  IconLoader2,
  IconSettings,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import type { SubscriptionStatus } from '@/lib/core/subscriptions/utils'

interface SubscriptionActionButtonProps {
  className?: string
  guestLabel?: string
  subscribeLabel?: string
  manageLabel?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export function SubscriptionActionButton({
  className,
  guestLabel = "Commencer l'essai gratuit",
  subscribeLabel,
  manageLabel = 'Gérer mon abonnement',
  size = 'default',
  variant = 'default',
}: SubscriptionActionButtonProps) {
  const { user, profile, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const subscriptionStatus = (profile?.subscription_status ??
    'trialing') as SubscriptionStatus
  const isActive = subscriptionStatus === 'active'

  const defaultSubscribeLabel =
    subscriptionStatus === 'trialing'
      ? 'Activer mon abonnement'
      : 'Débloquer la publication'

  const handleClick = async () => {
    const endpoint = isActive
      ? '/api/subscriptions/portal'
      : '/api/subscriptions/checkout'
    const genericError = isActive
      ? "Impossible d'ouvrir la gestion de l'abonnement."
      : "Impossible d'ouvrir la page d'abonnement."

    setIsSubmitting(true)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.url) {
        throw new Error(genericError)
      }

      window.location.assign(payload.url as string)
    } catch (error) {
      console.error('Subscription action failed:', error)
      toast.error(genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Button className={className} size={size} variant={variant} disabled>
        <IconLoader2 className="h-4 w-4 animate-spin" />
        Chargement...
      </Button>
    )
  }

  if (!user) {
    return (
      <Button asChild className={className} size={size} variant={variant}>
        <Link href="/register">
          <IconArrowRight className="h-4 w-4" />
          {guestLabel}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      className={className}
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        <IconSettings className="h-4 w-4" />
      ) : (
        <IconCreditCard className="h-4 w-4" />
      )}
      {isActive ? manageLabel : (subscribeLabel ?? defaultSubscribeLabel)}
    </Button>
  )
}
