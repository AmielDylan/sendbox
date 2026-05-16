'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconClipboardCheck,
  IconUserCheck,
  IconId,
  IconMapPin,
  IconPlaneDeparture,
  IconRosetteDiscountCheck,
  IconShieldCheck,
  IconStar,
  IconUserCircle,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LandingCta } from '@/components/landing/LandingCta'
import { LatestAnnouncementsCarousel } from '@/components/landing/LatestAnnouncementsCarousel'
import { PricingSection } from '@/components/landing/PricingSection'

const trustSignals = [
  { label: 'Identité vérifiée', icon: IconId },
  { label: 'Photos horodatées', icon: IconCamera },
  { label: 'Avis certifiés', icon: IconStar },
  { label: 'Profil public', icon: IconUserCircle },
]

const features = [
  {
    title: 'Mise en relation claire',
    description:
      "1,50 € de frais de mise en relation pour l'expéditeur à la confirmation mutuelle. Le transport se règle directement entre les parties.",
    icon: IconUserCheck,
  },
  {
    title: 'Voyageurs vérifiés',
    description:
      'Chaque profil passe par un KYC obligatoire, des avis mutuels immuables et un score de confiance public lisible par tous.',
    icon: IconCircleCheck,
  },
  {
    title: 'Preuves horodatées',
    description:
      'Photos de remise et de livraison horodatées par le serveur. Confirmées par les deux parties, conservées 12 mois.',
    icon: IconCamera,
  },
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

const steps = [
  {
    title: 'Créer son profil vérifié',
    description: "KYC obligatoire à l'inscription",
    icon: IconShieldCheck,
  },
  {
    title: 'Trouver un voyageur ou annoncer son trip',
    description: 'Recherche par corridor et date',
    icon: IconPlaneDeparture,
  },
  {
    title: 'Confirmer la mise en relation',
    description: 'Les deux parties confirment',
    icon: IconClipboardCheck,
    badge: '1,50 € de frais de mise en relation',
  },
  {
    title: 'Remise + livraison avec photo',
    description: 'Horodatée par le serveur, confirmée par les deux',
    icon: IconCamera,
  },
  {
    title: 'Évaluation mutuelle',
    description: 'Avis simultanés et immuables',
    icon: IconRosetteDiscountCheck,
  },
]

const senderBenefits: React.ReactNode[] = [
  'Trouvez un voyageur sur votre corridor diaspora',
  <>Confirmez la mise en relation pour <strong className="font-semibold text-foreground">1,50 €</strong></>,
  'Suivez la remise et la livraison avec preuves',
]

const travelerBenefits = [
  'Annoncez vos trajets et vos disponibilités',
  'Recevez des demandes alignées avec vos dates',
  'Inscription et utilisation gratuites',
]

export function HomePageContent() {
  return (
    <div className="landing-v2 relative overflow-x-hidden bg-background">
      {/* Hero */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-wide relative z-10 py-20 sm:py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Faites voyager vos colis avec des voyageurs{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">de confiance</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1" />
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Une plateforme qui connecte la diaspora. Profils vérifiés,
                livraisons tracées et preuves horodatées à chaque étape.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground sm:text-sm">
                {trustSignals.map(signal => {
                  const Icon = signal.icon
                  return (
                    <span key={signal.label} className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {signal.label}
                    </span>
                  )
                })}
              </div>

              <LandingCta
                className="flex-wrap sm:flex-nowrap pt-2"
                registerClassName="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                searchClassName="w-full sm:w-auto border-2 hover:bg-accent transition-all duration-300"
              />
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

      {/* Features */}
      <section className="relative bg-muted/30 py-24 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="container-wide relative">
          <div className="mb-14 text-center space-y-4 animate-fade-in-up">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Nos engagements
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pourquoi <span className="text-primary">Sendbox</span> ?
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Une solution simple, sûre et lisible pour organiser une mise en
              relation claire entre expéditeurs et voyageurs.
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
                    <Icon className="h-5 w-5 text-primary/80" />

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

      {/* Countries */}
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

      {/* Comment ça marche */}
      <section className="py-24 sm:py-32">
        <div className="container-wide space-y-12">
          <div className="space-y-4 animate-fade-in-up">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Le parcours
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Comment ça marche
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Un parcours simple, vérifiable et conçu pour que chacun sache où
              il en est.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="flex flex-col gap-4 rounded-lg border bg-background p-5 animate-fade-in-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <h3 className="font-semibold leading-snug">{step.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  {step.badge ? (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {step.badge}
                    </Badge>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="bg-muted/30 py-24 sm:py-32">
        <div className="container-wide space-y-12">
          <div className="space-y-4 animate-fade-in-up">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Utilisateurs
            </Badge>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pour qui ?
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Sendbox accompagne les expéditeurs et les voyageurs qui veulent
              organiser une mise en relation claire.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AudienceCard
              title="Expéditeurs"
              benefits={senderBenefits}
              cta="Chercher un voyageur"
              href="/recherche"
            />
            <AudienceCard
              title="Voyageurs"
              benefits={travelerBenefits}
              cta="Publier mon trajet"
              href="/dashboard/annonces/new"
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Le règlement du transport se fait directement entre expéditeur et
            voyageur, hors plateforme.
          </p>
        </div>
      </section>

      <PricingSection />
      <LatestAnnouncementsCarousel />

      {/* CTA final */}
      <section className="relative overflow-hidden py-28 sm:py-36">
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
              Créez votre profil et rejoignez un réseau de voyageurs vérifiés.
            </h2>

            <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Créez votre profil vérifié et rejoignez un réseau de voyageurs de
              confiance.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full px-8 py-6 text-sm shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 sm:w-auto sm:text-base"
              >
                <Link href="/register">
                  Créer mon compte
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

function AudienceCard({
  title,
  benefits,
  cta,
  href,
}: {
  title: string
  benefits: React.ReactNode[]
  cta: string
  href: string
}) {
  return (
    <Card className="rounded-xl border-2 bg-background transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex gap-3 text-sm leading-6">
              <IconCheck
                aria-hidden="true"
                className="mt-1 h-4 w-4 shrink-0 text-primary"
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
