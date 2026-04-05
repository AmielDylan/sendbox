'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCheck,
  IconClock,
  IconMapPin,
  IconPackage,
  IconPlaneDeparture,
  IconQrcode,
  IconShieldCheck,
  IconSparkles,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LandingCta } from '@/components/landing/LandingCta'
import { LatestAnnouncementsCarousel } from '@/components/landing/LatestAnnouncementsCarousel'
import { PricingSection } from '@/components/landing/PricingSection'
import { TrustStatsBlock } from '@/components/landing/TrustStatsBlock'

const proofPillars = [
  {
    title: 'Voyage vérifié',
    description:
      'Chaque trajet publié s’appuie sur un profil contrôlé et un cadre de publication clair.',
    icon: IconShieldCheck,
  },
  {
    title: 'Paiement sécurisé',
    description:
      'L’argent reste protégé sur la plateforme pendant que le colis suit son parcours.',
    icon: IconSparkles,
  },
  {
    title: 'Suivi concret',
    description:
      'QR code, messagerie et confirmations terrain gardent voyageurs et expéditeurs alignés.',
    icon: IconQrcode,
  },
]

const audienceColumns = [
  {
    title: 'Voyageurs',
    eyebrow: 'Rentabilisez vos déplacements',
    ctaLabel: 'Publier un trajet',
    href: '/register',
    icon: IconPlaneDeparture,
    points: [
      'Publiez vos trajets en quelques minutes',
      'Recevez des demandes filtrées et sécurisées',
      'Gardez une vue claire sur vos revenus et votre activité',
    ],
  },
  {
    title: 'Expéditeurs',
    eyebrow: 'Choisissez un trajet déjà structuré',
    ctaLabel: 'Rechercher un trajet',
    href: '/recherche',
    icon: IconPackage,
    points: [
      'Repérez rapidement un voyage pertinent',
      'Payez en ligne sur un flux encadré par la plateforme',
      'Suivez votre envoi jusqu’à la remise confirmée',
    ],
  },
]

export function HomePageContent() {
  return (
    <div className="landing-v2 relative overflow-x-hidden bg-background">
      <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(26,179,195,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%)]">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 to-transparent" />
        <div className="absolute left-[-8%] top-24 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-12 right-[-6%] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="container-wide relative z-10 flex min-h-[calc(100svh-4rem)] items-center py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.96fr)] lg:gap-16">
            <div className="space-y-8 animate-fade-in-up">
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/25 bg-background/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground backdrop-blur"
                >
                  France ↔ Bénin • Marketplace encadrée
                </Badge>

                <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
                  Transformez chaque{' '}
                  <span className="relative inline-block text-primary">
                    voyage
                    <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/15" />
                  </span>{' '}
                  en solution d’envoi sécurisée
                </h1>

                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Sendbox relie les voyageurs et les expéditeurs autour d’un
                  cadre simple: publication structurée, paiement en ligne
                  sécurisé, suivi terrain et confiance visible des deux côtés.
                </p>
              </div>

              <div className="flex flex-wrap gap-8 border-y border-border/60 py-5">
                {[
                  { value: '2,500+', label: 'Colis livrés' },
                  { value: '1,200+', label: 'Utilisateurs actifs' },
                  { value: '4.8/5', label: 'Note moyenne' },
                ].map(item => (
                  <div key={item.label} className="min-w-[120px]">
                    <p className="text-3xl font-bold tracking-tight text-primary">
                      {item.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <LandingCta
                className="gap-3"
                registerClassName="min-w-[220px] bg-primary px-6 py-6 text-base shadow-lg shadow-primary/20 transition-transform duration-300 hover:scale-[1.01] hover:bg-primary/90"
                searchClassName="min-w-[220px] border border-border/80 bg-background/90 px-6 py-6 text-base shadow-sm transition-transform duration-300 hover:scale-[1.01] hover:bg-accent"
              />

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <IconShieldCheck className="h-4 w-4 text-primary" />
                  Profils vérifiés
                </span>
                <span className="inline-flex items-center gap-2">
                  <IconSparkles className="h-4 w-4 text-primary" />
                  Paiement en ligne sécurisé
                </span>
                <span className="inline-flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-primary" />
                  Support réactif
                </span>
              </div>
            </div>

            <div className="relative animate-fade-in-up animation-delay-200">
              <div className="absolute inset-8 rounded-[2rem] border border-primary/15 bg-background/55 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/85 p-5 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Vue voyageur
                    </p>
                    <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                      Publiez, acceptez, transportez, confirmez: la promesse
                      reste lisible dès le premier écran.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <IconMapPin className="h-3.5 w-3.5" />
                    Trajets disponibles
                  </div>
                </div>

                <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-border/60 bg-gradient-to-br from-background via-muted/20 to-primary/10">
                  <Image
                    src="/images/hero.png"
                    alt="Sendbox — marketplace voyageurs et expéditeurs"
                    width={1365}
                    height={768}
                    priority
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustStatsBlock />

      <section className="py-20 sm:py-24">
        <div className="container-wide">
          <div className="max-w-3xl space-y-4">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Ce que Sendbox encadre
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Une promesse simple pour deux usages réels.
            </h2>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              Côté voyageurs, chaque publication devient une source de revenus
              mieux structurée. Côté expéditeurs, chaque réservation avance dans
              un cadre concret et lisible.
            </p>
          </div>

          <div className="mt-10 grid gap-8 border-t border-border/70 pt-8 md:grid-cols-3">
            {proofPillars.map(({ title, description, icon: Icon }) => (
              <div key={title} className="space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-20 sm:py-24">
        <div className="container-wide space-y-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge
                variant="outline"
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
              >
                Deux points d’entrée
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Le même cadre, deux façons d’utiliser Sendbox.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              La landing n’oppose pas les usages: elle montre comment le trajet
              publié par un voyageur devient une option claire pour un
              expéditeur prêt à réserver.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {audienceColumns.map(
              ({ title, eyebrow, ctaLabel, href, icon: Icon, points }) => (
                <div
                  key={title}
                  className="rounded-[2rem] border border-border/70 bg-background/85 p-7 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {eyebrow}
                      </p>
                      <h3 className="text-3xl font-semibold tracking-tight">
                        {title}
                      </h3>
                    </div>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>

                  <ul className="mt-6 space-y-4">
                    {points.map(point => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/12 text-primary">
                          <IconCheck className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm leading-6 text-foreground sm:text-base">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild variant="outline" className="mt-8">
                    <Link href={href}>
                      {ctaLabel}
                      <IconArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <LatestAnnouncementsCarousel />
      <PricingSection />

      <section className="relative overflow-hidden py-24 sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(26,179,195,0.12),_transparent_34%)]" />
        <div className="container-wide relative">
          <div className="mx-auto max-w-4xl space-y-8 rounded-[2.25rem] border border-border/70 bg-background/90 px-6 py-10 text-center shadow-[0_30px_90px_-60px_rgba(15,23,42,0.5)] backdrop-blur sm:px-10 sm:py-14">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Prêt à passer à l’action
            </Badge>
            <div className="space-y-3">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Publiez un trajet ou trouvez-en un déjà prêt.
              </h2>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                La publication côté voyageur reste encadrée par l’essai puis
                l’abonnement. La réservation côté expéditeur garde un parcours
                lisible du premier message à la confirmation finale.
              </p>
            </div>

            <LandingCta
              className="justify-center gap-3"
              registerClassName="min-w-[220px] bg-primary px-6 py-6 text-base shadow-lg shadow-primary/20"
              searchClassName="min-w-[220px] border border-border/80 px-6 py-6 text-base"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
