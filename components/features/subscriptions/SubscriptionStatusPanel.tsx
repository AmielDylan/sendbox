'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconLock,
  IconSparkles,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'
import {
  checkCanPublish,
  type SubscriptionStatus,
} from '@/lib/core/subscriptions/utils'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import { SubscriptionActionButton } from './SubscriptionActionButton'

type SubscriptionPanelVariant = 'banner' | 'page' | 'compact'

interface SubscriptionStatusPanelProps {
  className?: string
  variant?: SubscriptionPanelVariant
  showOnlyWhenAttention?: boolean
}

const formatDate = (value?: string | null) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function SubscriptionStatusPanel({
  className,
  variant = 'banner',
  showOnlyWhenAttention = false,
}: SubscriptionStatusPanelProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const { data, isLoading } = useSubscriptionStatus()

  const view = useMemo(() => {
    if (!profile) return null

    const status = (data?.status ??
      profile.subscription_status ??
      'trialing') as SubscriptionStatus
    const trialEndsAt = data?.trial_ends_at ?? profile.trial_ends_at ?? null
    const trialDaysRemaining = data?.trial_days_remaining ?? null
    const subscriptionExpiresAt = profile.subscription_expires_at ?? null
    const canPublish =
      data?.can_publish ?? checkCanPublish(status, trialEndsAt ?? null)
    const isTrialEndingSoon =
      status === 'trialing' &&
      trialDaysRemaining !== null &&
      trialDaysRemaining <= 5
    const needsAttention =
      !canPublish ||
      status === 'past_due' ||
      status === 'inactive' ||
      isTrialEndingSoon

    const usefulDate =
      status === 'trialing'
        ? formatDate(trialEndsAt)
        : formatDate(subscriptionExpiresAt)

    if (status === 'active') {
      return {
        accent: 'border-emerald-500/30 bg-emerald-500/8',
        badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
        badgeLabel: 'Abonnement actif',
        title: 'Publication illimitée activée',
        description:
          'Votre espace voyageur est prêt pour publier, suivre vos demandes et gérer votre activité sans interruption.',
        metaLabel: 'Publication',
        metaValue: 'Autorisée',
        dateLabel: usefulDate ? 'Date utile' : null,
        dateValue: usefulDate,
        canPublish,
        needsAttention,
      }
    }

    if (status === 'trialing' && canPublish) {
      return {
        accent:
          trialDaysRemaining !== null && trialDaysRemaining <= 5
            ? 'border-amber-500/35 bg-amber-500/10'
            : 'border-sky-500/25 bg-sky-500/8',
        badgeClass:
          trialDaysRemaining !== null && trialDaysRemaining <= 5
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
            : 'border-sky-500/25 bg-sky-500/10 text-sky-700',
        badgeLabel: 'Essai en cours',
        title:
          trialDaysRemaining === 1
            ? 'Dernier jour pour publier sans abonnement'
            : `${trialDaysRemaining ?? 0} jours d’essai restants`,
        description:
          'Votre essai voyageur vous laisse encore publier. Activez l’abonnement avant la fin de période pour éviter un blocage au prochain trajet.',
        metaLabel: 'Publication',
        metaValue: 'Autorisée',
        dateLabel: usefulDate ? 'Essai jusqu’au' : null,
        dateValue: usefulDate,
        canPublish,
        needsAttention,
      }
    }

    if (status === 'past_due') {
      return {
        accent: 'border-amber-500/35 bg-amber-500/10',
        badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
        badgeLabel: 'Paiement à régulariser',
        title: 'Votre abonnement doit être remis à jour',
        description:
          'La publication de nouveaux trajets est suspendue tant que le renouvellement n’est pas régularisé.',
        metaLabel: 'Publication',
        metaValue: 'Verrouillée',
        dateLabel: usefulDate ? 'Date utile' : null,
        dateValue: usefulDate,
        canPublish,
        needsAttention,
      }
    }

    if (status === 'canceled') {
      return {
        accent: 'border-slate-400/30 bg-slate-500/8',
        badgeClass: 'border-slate-400/30 bg-slate-500/10 text-slate-700',
        badgeLabel: 'Abonnement annulé',
        title: 'Réactivez votre abonnement avant la prochaine publication',
        description:
          'Votre abonnement n’est plus actif. Repassez par la souscription pour continuer à publier vos trajets sans friction.',
        metaLabel: 'Publication',
        metaValue: canPublish ? 'Autorisée' : 'Verrouillée',
        dateLabel: usefulDate ? 'Date utile' : null,
        dateValue: usefulDate,
        canPublish,
        needsAttention,
      }
    }

    return {
      accent: 'border-rose-500/30 bg-rose-500/8',
      badgeClass: 'border-rose-500/30 bg-rose-500/10 text-rose-700',
      badgeLabel: 'Abonnement requis',
      title: 'La publication de nouveaux trajets est bloquée',
      description:
        'Activez votre abonnement voyageur pour remettre en ligne vos trajets et continuer à recevoir des demandes.',
      metaLabel: 'Publication',
      metaValue: 'Verrouillée',
      dateLabel: usefulDate ? 'Date utile' : null,
      dateValue: usefulDate,
      canPublish,
      needsAttention,
    }
  }, [data, profile])

  if (!isFeatureEnabled('SUBSCRIPTION_ENABLED') || authLoading || !user) {
    return null
  }

  if ((profile as any)?.role === 'admin') {
    return null
  }

  if (isLoading || !view) {
    return (
      <Card
        className={cn(
          'animate-pulse rounded-3xl border border-border/70 bg-muted/30',
          variant === 'compact' ? 'p-4' : 'p-6',
          className
        )}
      >
        <div className="h-4 w-28 rounded bg-muted-foreground/20" />
        <div className="mt-4 h-7 w-3/5 rounded bg-muted-foreground/20" />
        <div className="mt-3 h-4 w-4/5 rounded bg-muted-foreground/20" />
      </Card>
    )
  }

  if (showOnlyWhenAttention && !view.needsAttention) {
    return null
  }

  const isCompact = variant === 'compact'
  const compactCopy =
    view.badgeLabel === 'Paiement à régulariser'
      ? 'Paiement à régulariser pour réactiver la publication.'
      : view.badgeLabel === 'Essai en cours'
        ? `Essai bientôt terminé${view.dateValue ? `, jusqu’au ${view.dateValue}` : ''}.`
        : view.badgeLabel === 'Abonnement annulé'
          ? 'Abonnement inactif. Réactivez-le avant votre prochaine publication.'
          : 'Publication bloquée tant que l’abonnement voyageur n’est pas actif.'

  if (isCompact) {
    return (
      <Card
        className={cn(
          'rounded-xl border border-border/70 bg-muted/40 px-3 py-3 shadow-none',
          className
        )}
      >
        <div className="space-y-3">
          <p className="text-[11px] leading-4 text-foreground/75">
            {compactCopy}
          </p>

          <SubscriptionActionButton
            className="w-full text-xs"
            size="sm"
            subscribeLabel="Activer"
            manageLabel="Gérer"
          />
        </div>
      </Card>
    )
  }

  const wrapperClassName = variant === 'page' ? 'p-6 sm:p-8' : 'p-5 sm:p-6'

  const titleSize =
    variant === 'page' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'

  const icon =
    view.canPublish && view.badgeLabel !== 'Paiement à régulariser' ? (
      <IconSparkles className="h-5 w-5 text-primary" />
    ) : view.badgeLabel === 'Paiement à régulariser' ? (
      <IconClock className="h-5 w-5 text-amber-700" />
    ) : (
      <IconAlertTriangle className="h-5 w-5 text-rose-700" />
    )

  return (
    <Card
      className={cn(
        'rounded-3xl border shadow-sm',
        view.accent,
        wrapperClassName,
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-6',
          variant !== 'page' && 'lg:flex-row lg:items-end lg:justify-between'
        )}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge
              variant="outline"
              className={cn('px-3 py-1', view.badgeClass)}
            >
              {icon}
              {view.badgeLabel}
            </Badge>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <IconLock className="h-3.5 w-3.5" />
              {view.metaLabel} : {view.metaValue}
            </span>
            {view.dateLabel && view.dateValue && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                <IconCalendarEvent className="h-3.5 w-3.5" />
                {view.dateLabel} : {view.dateValue}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h2
              className={cn(
                'max-w-3xl font-semibold tracking-tight',
                titleSize
              )}
            >
              {view.title}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              {view.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <SubscriptionActionButton
            className="w-full sm:w-auto"
            size={variant === 'page' ? 'lg' : 'default'}
          />
          <Button
            asChild
            variant="outline"
            size={variant === 'page' ? 'lg' : 'default'}
            className="w-full sm:w-auto"
          >
            <Link
              href={
                variant === 'page'
                  ? view.canPublish
                    ? '/dashboard/annonces/new'
                    : '/dashboard'
                  : '/dashboard/reglages/abonnement'
              }
            >
              {variant === 'page'
                ? view.canPublish
                  ? 'Publier un trajet'
                  : 'Retour au dashboard'
                : 'Mon abonnement'}
            </Link>
          </Button>
        </div>
      </div>

      {variant === 'page' && (
        <div className="mt-8 grid gap-6 border-t border-border/60 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ce que débloque l’offre voyageur
            </p>
            <ul className="grid gap-3 text-sm text-foreground sm:grid-cols-2">
              {[
                'Publication de trajets sans limite de volume',
                'Visibilité renforcée côté expéditeurs',
                'Gestion des demandes depuis un seul espace',
                'Paiement en ligne sécurisé pour vos réservations',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/75 p-5">
            <p className="text-sm font-semibold text-foreground">
              Rappel de fonctionnement
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Essai gratuit de 14 jours à partir de l’inscription, puis
                abonnement à 4,99 € / mois pour continuer à publier.
              </p>
              <p>
                Les frais plateforme restent distincts: 3 % par transaction
                validée sur la plateforme.
              </p>
              <p>
                Aucun flux local Bénin supplémentaire n’est demandé dans cet
                espace: vous gérez uniquement l’accès à la publication.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
