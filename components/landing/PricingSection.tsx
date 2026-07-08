'use client'

import Link from 'next/link'
import { IconArrowRight, IconCheck } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const perks = [
  'Inscription et utilisation gratuites',
  'Profil voyageur vérifié (KYC)',
  'Preuves horodatées serveur',
  'Avis mutuels et signaux anti-abus',
]

export function PricingSection() {
  const { user } = useAuth()
  const ctaHref = user ? '/dashboard/annonces/new' : '/register'
  const ctaLabel = user ? 'Publier un trajet' : 'Créer mon compte'

  return (
    <section className="py-20 sm:py-24">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl space-y-4 animate-fade-in-up">
          <Badge
            variant="outline"
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
          >
            Transparent
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Simple et sans surprise
          </h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Sendbox facture uniquement les frais de mise en relation entre
            expéditeur et voyageur.
          </p>
        </div>

        <div className="grid gap-6 rounded-[2rem] border border-border/70 bg-background p-8 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">
                Frais de mise en relation
              </p>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                  2,90 €
                </p>
                <p className="pb-1.5 text-sm text-muted-foreground sm:pb-2 sm:text-base">
                  beta / mise en relation
                </p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {user
                ? "Réglé par l'expéditeur uniquement, après accord mutuel avec le voyageur."
                : "Tarif beta réglé par l'expéditeur après accord mutuel. Inscription et utilisation gratuites pour tous."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={ctaHref}>
                  {ctaLabel}
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
                  <span className="text-sm leading-6 text-foreground">
                    {perk}
                  </span>
                </li>
              ))}
            </ul>

            <p className="border-t border-border/60 pt-4 text-sm leading-6 text-muted-foreground">
              Le prix du transport est défini avant le paiement des frais
              Sendbox, puis réglé directement entre expéditeur et voyageur, hors
              plateforme. Sendbox n'est pas transporteur ni intermédiaire de
              paiement.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
