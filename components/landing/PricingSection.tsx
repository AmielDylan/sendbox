'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'
import { SubscriptionActionButton } from '@/components/features/subscriptions/SubscriptionActionButton'

const perks = [
  'Publication de trajets illimitée',
  'Profil voyageur vérifié',
  'Tableau de bord revenus & demandes',
  'Support prioritaire',
]

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

export function PricingSection() {
  const { user, profile } = useAuth()
  const { data } = useSubscriptionStatus()
  const detailsHref = user ? '/dashboard/reglages/abonnement' : '/register'
  const detailsLabel = user ? 'Voir mon abonnement' : 'Créer mon compte'

  const status = data?.status ?? profile?.subscription_status ?? 'trialing'
  const trialEndsAt = formatDate(data?.trial_ends_at ?? profile?.trial_ends_at)
  const trialDaysRemaining = data?.trial_days_remaining ?? null

  const contextualLine = !user
    ? 'Inscription gratuite avec 14 jours d’essai.'
    : status === 'active'
      ? 'Votre abonnement est actif.'
      : status === 'trialing' && trialDaysRemaining !== null
        ? `Essai en cours: ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} restant${trialDaysRemaining > 1 ? 's' : ''}${trialEndsAt ? `, jusqu’au ${trialEndsAt}` : ''}.`
        : 'La publication nécessite un abonnement voyageur actif.'

  return (
    <section className="py-20 sm:py-24">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl space-y-4 animate-fade-in-up">
          <Badge
            variant="outline"
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
          >
            Abonnement voyageur
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Publiez sans friction après l’essai.
          </h2>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            Une offre simple pour continuer à publier vos trajets et garder
            votre activité visible.
          </p>
        </div>

        <div className="grid gap-6 rounded-[2rem] border border-border/70 bg-background p-8 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                14 jours d’essai
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-5xl font-bold tracking-tight">4,99 €</p>
                <p className="pb-2 text-base text-muted-foreground">/ mois</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {contextualLine}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <SubscriptionActionButton
                className="w-full sm:w-auto"
                guestLabel="Démarrer l’essai"
                subscribeLabel="Activer l’abonnement"
                manageLabel="Gérer mon abonnement"
                size="lg"
              />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href={detailsHref}>
                  {detailsLabel}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <ul className="grid gap-3 sm:grid-cols-2">
              {perks.map(perk => (
                <li key={perk} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-foreground sm:text-base">
                    {perk}
                  </span>
                </li>
              ))}
            </ul>

            <p className="border-t border-border/60 pt-4 text-sm leading-6 text-muted-foreground">
              + 3 % de frais plateforme par transaction validée. L’abonnement
              s’active à la première publication.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
