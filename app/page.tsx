/**
 * Landing Page Sendbox - Design System "Warm Transit"
 * Covalisage international Europe-Afrique
 */

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  IconShieldCheck,
  IconArrowRight,
  IconCurrencyEuro,
  IconClock,
  IconMapPin,
  IconSparkles,
  IconPackage,
  IconUsers,
  IconPlaneDeparture,
} from '@tabler/icons-react'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { PublicFooter } from '@/components/layouts/PublicFooter'
import { LandingCta } from '@/components/landing/LandingCta'

const features = [
  {
    title: 'Tarifs clairs',
    description: 'Jusqu\'à 60% moins cher que les services classiques.',
    icon: IconCurrencyEuro,
  },
  {
    title: 'Voyageurs vérifiés',
    description: 'Identités contrôlées, profils notés et support actif.',
    icon: IconShieldCheck,
  },
  {
    title: 'Livraison rapide',
    description: 'Délais courts et suivi en temps réel de vos colis.',
    icon: IconClock,
  },
]

const steps = [
  {
    title: 'Recherchez un trajet',
    description: 'Trouvez un voyageur de confiance sur votre axe.',
    icon: IconMapPin,
  },
  {
    title: 'Réservez votre espace',
    description: 'Indiquez le poids et décrivez votre colis simplement.',
    icon: IconPackage,
  },
  {
    title: 'Remettez votre colis',
    description: 'Rencontrez le voyageur et confiez-lui votre colis.',
    icon: IconUsers,
  },
  {
    title: 'Suivez la livraison',
    description: 'Recevez des notifications jusqu\'à la livraison finale.',
    icon: IconPlaneDeparture,
  },
]

export default function HomePage() {
  return (
    <div className="landing min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 bg-background">
        {/* HERO SECTION */}
        <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-hero-image opacity-35" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/50 to-background" aria-hidden="true" />

          <div className="container mx-auto px-8 sm:px-16 lg:px-24 relative z-10 grid gap-10 lg:grid-cols-2 lg:gap-16 items-center py-12 sm:py-16 md:py-20">
            <div className="space-y-6 text-center lg:text-left">
              <Badge
                variant="outline"
                className="gap-2 rounded-md px-3 py-1 text-xs border-foreground/25 bg-background/90 text-foreground shadow-sm backdrop-blur dark:bg-background/50"
              >
                <IconSparkles className="h-3 w-3 text-primary" />
                Service sécurisé et vérifié
              </Badge>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-balance tracking-tight leading-tight">
                Envoyez vos colis entre l'Europe et l'Afrique
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Covalisage international rapide, sécurisé et économique pour la France et le Bénin.
              </p>

              <div className="flex flex-col gap-5 items-center lg:items-start">
                <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-2.5 py-1 rounded-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-foreground">
                    Actuellement disponible entre la France et le Bénin
                  </span>
                </div>

                <LandingCta
                  className="justify-center lg:justify-start w-full"
                  registerClassName="min-w-[140px] rounded-md"
                  searchClassName="min-w-[140px] rounded-md"
                  arrowClassName="ml-2"
                  mapClassName="mr-2"
                />
              </div>
            </div>

            <div className="relative order-first lg:order-last hidden sm:block">
              <div className="relative w-full max-w-[240px] sm:max-w-[320px] md:max-w-[400px] lg:ml-auto transform hover:scale-[1.01] transition-transform duration-500">
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/40 shadow-xl shadow-primary/5">
                  <Image
                    src="/images/illustrations/envoi-colis.svg"
                    alt="Envoi de colis France-Bénin"
                    width={520}
                    height={520}
                    priority
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-8 sm:px-16 lg:px-24">
            <div className="text-center space-y-3 mb-12">
              <Badge variant="outline" className="text-xs uppercase tracking-wide rounded-md border-primary/20 text-primary bg-primary/5">
                Nos avantages
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-balance">
                Pourquoi choisir Sendbox ?
              </h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Une solution simple, sécurisée et adaptée aux trajets France-Bénin.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className="border-border bg-card/50 hover:bg-card transition-all duration-300 rounded-lg">
                    <CardHeader className="space-y-3 p-5 sm:p-6">
                      <div className="h-10 w-10 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1.5">
                        <CardTitle className="text-lg font-bold">
                          {feature.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-muted-foreground/80">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container mx-auto px-8 sm:px-16 lg:px-24 space-y-16">

            <div className="text-center space-y-3">
              <Badge variant="outline" className="text-xs uppercase tracking-wide rounded-md border-primary/20 text-primary bg-primary/5">
                Processus simple
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-balance">
                Comment ça marche ?
              </h2>
              <p className="text-base text-muted-foreground">
                Envoyez votre colis en 4 étapes simples.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="hidden sm:block relative w-full flex justify-center">
                <div className="relative w-full max-w-[420px]">
                  <Image
                    src="/images/illustrations/covoiturage.svg"
                    alt="Comment fonctionne le covoiturage de colis"
                    width={600}
                    height={600}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center w-full">
                <ol className="space-y-4 w-full">
                  {steps.map((step) => {
                    const Icon = step.icon
                    return (
                      <li
                        key={step.title}
                        className="group flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/30 hover:bg-card hover:border-border transition-all duration-300 w-full"
                      >
                        <span className="flex-none flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm text-foreground transition-all group-hover:border-primary/20 group-hover:shadow-md group-hover:text-primary mt-1">
                          <Icon size={20} className="transition-transform duration-300 group-hover:scale-110" />
                        </span>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-8 sm:px-16 lg:px-24">
            <div className="relative overflow-hidden border border-border bg-primary/5 rounded-xl px-5 py-12 sm:px-10 sm:py-16 text-center space-y-6">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-[200px] h-[200px] bg-primary/10 rounded-full blur-[60px] -z-10" />
              <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-[150px] h-[150px] bg-primary/5 rounded-full blur-[40px] -z-10" />

              <div className="max-w-lg mx-auto space-y-5">
                <Badge variant="outline" className="gap-2 rounded-md px-3 py-1 text-xs cursor-default bg-background border-primary/20 text-foreground shadow-sm">
                  <IconSparkles className="h-3.5 w-3.5 text-primary" />
                  Prêt à commencer ?
                </Badge>

                <h2 className="font-display text-2xl sm:text-3xl text-balance font-bold leading-tight">
                  Rejoignez une communauté <br className="hidden sm:block" /> en pleine croissance
                </h2>

                <p className="text-base text-muted-foreground max-w-md mx-auto">
                  Créez votre compte, vérifiez votre identité et envoyez votre premier colis dès aujourd'hui.
                </p>

                <div className="pt-2">
                  <Button asChild className="rounded-md px-6 shadow-md hover:shadow-lg transition-shadow">
                    <Link href="/register">
                      Créer mon compte
                      <IconArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
