'use client'

import Link from 'next/link'
import { IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const perks = [
  'Ces frais couvrent uniquement la mise en relation Sendbox.',
  'Le montant du transport est convenu et réglé directement entre les parties.',
  'Le prix total est visible avant tout engagement.',
]

export function PricingSection() {
  const { user } = useAuth()
  const ctaHref = user ? '/dashboard/annonces/new' : '/register'
  const ctaLabel = user ? 'Publier un trajet' : 'Créer mon compte'

  return (
    <section className="py-16 sm:py-24">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl space-y-4 animate-fade-in-up">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Un seul frais, affiché avant de confirmer.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Sendbox perçoit 2,90&nbsp;€ par mise en relation confirmée, réglés
            par l'expéditeur. Le reste se passe directement entre vous.
          </p>
        </div>

        <div className="grid gap-6 rounded-xl border border-border/80 bg-background p-6 lg:grid-cols-[0.7fr_1.2fr_auto] lg:items-center lg:p-8">
          <div className="space-y-3">
            <div className="mt-3 flex items-end gap-3">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                2,90 €
              </p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {user
                ? "Prélevé auprès de l'expéditeur après confirmation mutuelle."
                : 'Réglés par l’expéditeur. Inscription gratuite pour les deux parties.'}
            </p>
          </div>

          <div>
            <ul className="grid gap-3">
              {perks.map(perk => (
                <li key={perk} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-primary">
                    <IconCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-foreground">
                    {perk}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild size="lg" className="w-full lg:w-auto">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
