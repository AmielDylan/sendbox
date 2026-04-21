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
  type SubscriptionInfo,
  type SubscriptionStatus,
} from '@/lib/core/subscriptions/utils'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import { SubscriptionActionButton } from './SubscriptionActionButton'

type SubscriptionPanelVariant = 'banner' | 'page' | 'compact'
type SubscriptionPanelTone = 'default' | 'neutral'

interface SubscriptionStatusPanelProps {
  className?: string
  variant?: SubscriptionPanelVariant
  tone?: SubscriptionPanelTone
  showOnlyWhenAttention?: boolean
}

const getTrialDaysRemaining = (value?: string | null) => {
  if (!value) return null

  const trialEnd = new Date(value)
  if (Number.isNaN(trialEnd.getTime())) {
    return null
  }

  const diff = trialEnd.getTime() - Date.now()
  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / 86_400_000)
}

const getFallbackSubscriptionInfo = (profile: any): SubscriptionInfo | undefined => {
  if (!profile) return undefined

  const status = (profile.subscription_status ?? 'trialing') as SubscriptionStatus
  const trialEndsAt = profile.trial_ends_at ?? null

  return {
    status,
    trial_ends_at: trialEndsAt,
    trial_days_remaining:
      status === 'trialing' ? getTrialDaysRemaining(trialEndsAt) : null,
    can_publish: checkCanPublish(status, trialEndsAt),
  }
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
  tone = 'default',
  showOnlyWhenAttention = false,
}: SubscriptionStatusPanelProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const initialData = useMemo(
    () => getFallbackSubscriptionInfo(profile),
    [profile]
  )
  const { data, isLoading } = useSubscriptionStatus({
    initialData,
    staleTime: variant === 'compact' ? 600_000 : 300_000,
    refetchOnMount: variant !== 'compact',
  })

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
        status,
        trialDaysRemaining,
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
        status,
        trialDaysRemaining,
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
        status,
        trialDaysRemaining,
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
        status,
        trialDaysRemaining,
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
      status,
      trialDaysRemaining,
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

  const isCompact = variant === 'compact'

  if (!view || (isLoading && !initialData)) {
    if (isCompact) return null
    return (
      <Card
        className={cn(
          'animate-pulse rounded-3xl border border-border/70 bg-muted/30 p-6',
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

  const neutralPageTitle =
    view.status === 'active'
      ? 'Abonnement actif'
      : view.status === 'trialing'
        ? `${view.trialDaysRemaining ?? 0} jours restants`
        : view.status === 'past_due'
          ? 'Renouvellement à mettre à jour'
          : view.status === 'canceled'
            ? 'Abonnement annulé'
            : 'Abonnement nécessaire pour publier'

  const neutralPageDescription =
    view.status === 'active'
      ? 'Votre accès à la publication est actif et vos trajets peuvent être gérés normalement.'
      : view.status === 'trialing'
        ? 'Votre période d’essai est encore active. Vous pourrez publier jusqu’à la date indiquée.'
        : view.status === 'past_due'
          ? 'Votre accès à la publication dépend d’une mise à jour de votre abonnement.'
          : view.status === 'canceled'
            ? 'L’offre voyageur n’est plus active. Réactivez-la pour publier de nouveaux trajets.'
            : 'Activez l’offre voyageur pour débloquer la publication de nouveaux trajets.'

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

  if (variant === 'page' && tone === 'neutral') {
    return (
      <Card
        className={cn(
          'rounded-2xl border border-border/70 bg-card/40 p-5 shadow-none sm:p-6',
          className
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">
                {view.badgeLabel}
              </Badge>
              <Badge variant="secondary" className="text-xs font-medium">
                Publication : {view.metaValue}
              </Badge>
              {view.dateLabel && view.dateValue && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {view.dateLabel} : {view.dateValue}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold tracking-tight">
                {neutralPageTitle}
              </h2>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {neutralPageDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <SubscriptionActionButton
              className="w-full sm:w-auto"
              size="default"
            />
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard/reglages/paiements">Voir les paiements</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Statut
            </p>
            <p className="text-sm font-medium">{view.badgeLabel}</p>
          </div>
          <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Publication
            </p>
            <p className="text-sm font-medium">{view.metaValue}</p>
          </div>
          <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Offre
            </p>
            <p className="text-sm font-medium">
              {(profile as any)?.country === "BJ"
                ? '14 jours puis 3 275 XOF / mois'
                : '14 jours puis 4,99 € / mois'}
            </p>
          </div>
          <div className="space-y-1 rounded-xl border border-border/60 bg-background/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Frais plateforme
            </p>
            <p className="text-sm font-medium">3 % par transaction</p>
          </div>
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
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-foreground/70">
              <IconLock className="h-3.5 w-3.5" />
              {view.metaLabel} : {view.metaValue}
            </span>
            {view.dateLabel && view.dateValue && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-foreground/70">
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
                {(profile as any)?.country === "BJ"
                  ? "Essai gratuit de 14 jours, puis abonnement à 3 275 XOF / mois pour continuer à publier."
                  : "Essai gratuit de 14 jours à partir de l’inscription, puis abonnement à 4,99 € / mois pour continuer à publier."}
              </p>
              <p>
                Les frais plateforme restent distincts: 3 % par transaction
                validée sur la plateforme.
              </p>
              {(profile as any)?.country === "BJ" ? (
                <p>
                  Paiement par Mobile Money (MTN, Moov, Celtiis) via FedaPay.
                  L’accès est renouvelé manuellement chaque mois.
                </p>
              ) : (
                <p>
                  Aucun flux local Bénin supplémentaire n’est demandé dans cet
                  espace: vous gérez uniquement l’accès à la publication.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
