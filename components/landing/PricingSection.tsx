'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconArrowRight, IconCheck, IconSparkles } from '@tabler/icons-react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscriptionStatus } from '@/hooks/use-subscription-status'
import { SubscriptionActionButton } from '@/components/features/subscriptions/SubscriptionActionButton'

const perks = [
  'Profil professionnel vérifié',
  'Publication de trajets illimitée',
  'Tableau de bord revenus & envois',
  'Badge de confiance visible des expéditeurs',
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
  const detailsLabel = user ? 'Voir les détails' : 'Créer mon compte'

  const status = data?.status ?? profile?.subscription_status ?? 'trialing'
  const trialEndsAt = formatDate(data?.trial_ends_at ?? profile?.trial_ends_at)
  const trialDaysRemaining = data?.trial_days_remaining ?? null

  const contextualLine = !user
    ? 'Inscription gratuite. L’essai de 14 jours démarre dès l’ouverture du compte.'
    : status === 'active'
      ? 'Votre abonnement est déjà actif. Vous pouvez le gérer depuis votre espace.'
      : status === 'trialing' && trialDaysRemaining !== null
        ? `Vous avez encore ${trialDaysRemaining} jour${trialDaysRemaining > 1 ? 's' : ''} d’essai${trialEndsAt ? `, jusqu’au ${trialEndsAt}` : ''}.`
        : status === 'trialing'
          ? 'Votre essai est en cours. Activez l’abonnement avant la fin de période pour garder la publication ouverte.'
          : 'Votre prochaine publication nécessite un abonnement voyageur actif.'

  return (
    <section className="relative py-20 sm:py-28">
      <div className="container-wide">
        <div className="mb-12 max-w-3xl space-y-4 animate-fade-in-up">
          <Badge
            variant="outline"
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
          >
            Accès voyageur pro
          </Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Une offre claire pour publier régulièrement.
          </h2>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            L’abonnement ne vend pas une promesse abstraite: il débloque la
            publication côté voyageur, garde votre profil visible et structure
            votre activité au fil des trajets.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,rgba(26,179,195,0.12),rgba(255,255,255,0.92))] p-8 shadow-sm animate-fade-in-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
                <IconSparkles className="h-4 w-4 text-primary" />
                Offre voyageur
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  14 jours d’essai
                </p>
                <div className="mt-3 flex items-end gap-3">
                  <p className="text-5xl font-bold tracking-tight">4,99 €</p>
                  <p className="pb-2 text-base text-muted-foreground">/ mois</p>
                </div>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
                  L’offre s’active pour continuer à publier vos trajets après
                  l’essai. Les réservations gardent ensuite leur cadre sécurisé
                  sur la plateforme.
                </p>
              </div>

              <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-background/75 p-5">
                <p className="text-sm font-medium text-foreground">
                  {contextualLine}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SubscriptionActionButton
                    className="w-full sm:w-auto"
                    guestLabel="Créer mon compte et démarrer l’essai"
                    subscribeLabel="Activer mon abonnement"
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
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-background p-8 animate-fade-in-up animation-delay-100">
            <div className="grid gap-8">
              <div className="grid gap-4 sm:grid-cols-2">
                {perks.map(perk => (
                  <div key={perk} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <IconCheck className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm leading-6 text-foreground">
                      {perk}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">Activation</p>
                  <p className="mt-2 leading-6">
                    L’abonnement sert à maintenir la publication après l’essai,
                    pas à ouvrir le compte.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">
                    Frais plateforme
                  </p>
                  <p className="mt-2 leading-6">
                    + 3 % par transaction validée pour le cadre de réservation
                    et la protection du paiement.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="font-semibold text-foreground">Compatibilité</p>
                  <p className="mt-2 leading-6">
                    Aucun numéro béninois n’est demandé dans cette étape. Vous
                    gérez uniquement votre accès à la publication.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
