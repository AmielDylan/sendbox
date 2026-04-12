'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconCurrencyEuro,
  IconMapPin,
  IconShieldCheck,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LandingCta } from '@/components/landing/LandingCta'
import { LatestAnnouncementsCarousel } from '@/components/landing/LatestAnnouncementsCarousel'
import { PricingSection } from '@/components/landing/PricingSection'

const features = [
  {
    title: 'Tarifs transparents',
    description:
      'Un cadre clair pour réserver, payer et suivre vos envois sans négociation imprévisible.',
    icon: IconCurrencyEuro,
  },
  {
    title: 'Voyageurs vérifiés',
    description:
      'Chaque trajet passe par un profil contrôlé, des avis et un cadre de confiance lisible.',
    icon: IconShieldCheck,
  },
  {
    title: 'Suivi rapide',
    description:
      'Messagerie, statut et confirmations permettent de garder le même niveau d’information des deux côtés.',
    icon: IconClock,
  },
]

const stats = [
  { value: '2,500+', label: 'Colis livrés' },
  { value: '1,200+', label: 'Utilisateurs actifs' },
  { value: '4.8/5', label: 'Note moyenne' },
]

const activeCountries = [
  { flag: '🇫🇷', label: 'France' },
  { flag: '🇧🇯', label: 'Bénin' },
]

const upcomingCountries = [
  { flag: '🇹🇬', label: 'Togo' },
  { flag: '🇨🇮', label: "Côte d'Ivoire" },
  { flag: '🇸🇳', label: 'Sénégal' },
]

export function HomePageContent() {
  return (
    <div className="landing-v2 relative overflow-x-hidden bg-background">
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-wide relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Transformez chaque{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">voyage</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1" />
                </span>{' '}
                en solution d&apos;envoi sécurisée
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                La plateforme de covalisage qui connecte voyageurs et
                expéditeurs pour des envois{' '}
                <span className="font-semibold text-foreground">
                  économiques
                </span>
                , <span className="font-semibold text-foreground">rapides</span>{' '}
                et{' '}
                <span className="font-semibold text-foreground">sécurisés</span>
                .
              </p>

              <div className="flex flex-wrap gap-6 pt-2 lg:gap-8">
                {stats.map(stat => (
                  <div key={stat.label} className="space-y-1">
                    <div className="text-lg font-bold text-primary sm:text-xl">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <LandingCta
                className="flex-wrap sm:flex-nowrap pt-2"
                registerClassName="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                searchClassName="w-full sm:w-auto border-2 hover:bg-accent transition-all duration-300"
              />

              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <IconShieldCheck className="h-4 w-4 text-primary" />
                  Identités vérifiées
                </span>
                <span className="inline-flex items-center gap-2">
                  <IconCheck className="h-4 w-4 text-primary" />
                  Paiement en ligne sécurisé
                </span>
                <span className="inline-flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-primary" />
                  Support 24/7
                </span>
              </div>
            </div>

            <div className="relative mt-10 flex justify-center lg:mt-0 lg:block animate-fade-in-up animation-delay-200">
              <Image
                src="/images/hero.png"
                alt="Sendbox — covalisage international"
                width={680}
                height={640}
                priority
                className="h-auto w-full max-w-none object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-muted/30 py-20 sm:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="container-wide relative">
          <div className="mb-14 text-center space-y-4 animate-fade-in-up">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Nos avantages
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pourquoi <span className="text-primary">Sendbox</span> ?
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Une solution simple, sûre et lisible pour publier un trajet ou en
              réserver un.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon

              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-2 bg-background transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 transition-all duration-500 group-hover:from-primary/5 group-hover:to-transparent" />

                  <div className="relative space-y-5 p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold sm:text-2xl">
                        {feature.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground sm:text-[15px]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-10">
        <div className="container-wide">
          <div className="flex flex-col items-center justify-center gap-5">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              Pays couverts
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-5">
              <div className="flex items-center gap-2.5">
                {activeCountries.map(country => (
                  <div key={country.label} className="group relative">
                    <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 px-2.5 py-1.5 transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-md">
                      <span className="text-lg sm:text-xl">{country.flag}</span>
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {country.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-7 w-px bg-gradient-to-b from-transparent via-border to-transparent" />

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Bientôt
                </span>
                {upcomingCountries.map(country => (
                  <div key={country.label} className="group relative">
                    <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 opacity-70 transition-all duration-300 hover:opacity-100">
                      <span className="text-lg sm:text-xl">{country.flag}</span>
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {country.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />
      <LatestAnnouncementsCarousel />

      <section className="relative overflow-hidden py-24 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

        <div className="container-wide relative">
          <div className="mx-auto max-w-4xl space-y-8 text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <IconCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium sm:text-sm">
                Prêt à commencer ?
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Publiez un trajet ou trouvez-en un déjà prêt.
            </h2>

            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Une inscription gratuite pour démarrer, un abonnement simple pour
              continuer à publier, et un parcours clair côté expéditeur.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full px-8 py-6 text-sm shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 sm:w-auto sm:text-base"
              >
                <Link href="/register">
                  Créer mon compte gratuitement
                  <IconArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-2 px-8 py-6 text-sm transition-all duration-300 hover:scale-105 sm:w-auto sm:text-base"
              >
                <Link href="/recherche">
                  <IconMapPin className="h-5 w-5" />
                  Explorer les trajets
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
