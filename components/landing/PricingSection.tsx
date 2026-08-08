'use client'

import Link from 'next/link'
import { IconCheck } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const perks = [
  "Inscription et recherche gratuites",
  "Profils voyageurs et expéditeurs vérifiés",
  "Confirmation de livraison par preuve photo",
  "Avis certifiés et communauté de confiance",
]

export function PricingSection() {
  const { user } = useAuth()
  const ctaHref = user ? '/dashboard/annonces/new' : '/register'
  const ctaLabel = user ? 'Publier un trajet' : 'Créer mon compte'

  return (
    <section className="py-14 sm:py-16">
      <div className="container-wide">
        <div className="mb-10 max-w-2xl space-y-4 animate-fade-in-up">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Tarifs transparents et sans surprise
          </h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Sendbox facture uniquement la mise en relation. Le prix du transport se règle directement de main à main.
          </p>
        </div>

        <div className="grid gap-6 rounded-lg bg-card p-6 lg:grid-cols-[0.7fr_1.2fr_auto] lg:items-center lg:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Frais de mise en relation
            </p>
            <div>
              <div className="mt-3 flex items-end gap-3">
                <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                  2,90 EUR
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {user
                ? "Tarif de lancement réglé par l'expéditeur après accord mutuel."
                : "Tarif de lancement réglé par l'expéditeur après accord mutuel. Inscription gratuite pour tous."}
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

        <p className="mt-6 max-w-2xl text-xs leading-5 text-muted-foreground/70">
          Le prix du transport par kilo est convenu entre l'expéditeur et le voyageur avant la confirmation, puis réglé directement de main à main. Sendbox met en relation les utilisateurs dans un cadre sécurisé.
        </p>
      </div>
    </section>
  )
}
