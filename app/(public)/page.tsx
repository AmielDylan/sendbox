/**
 * Landing Page Sendbox - Design System "Warm Transit"
 * Covalisage international Europe ⇄ Afrique
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
} from '@tabler/icons-react'

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
    description: 'Trouvez un voyageur qui part sur votre axe France-Bénin.',
  },
  {
    title: 'Réservez votre espace',
    description: 'Indiquez le poids et décrivez votre colis simplement.',
  },
  {
    title: 'Remettez votre colis',
    description: 'Rencontrez le voyageur et confiez-lui votre colis.',
  },
  {
    title: 'Suivez la livraison',
    description: 'Recevez des notifications et échangez via le chat.',
  },
]

export default function HomePage() {
  return (
    <div className="bg-background">
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-image opacity-35" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/50 to-background" aria-hidden="true" />
        <div className="container-wide relative z-10 grid gap-10 lg:grid-cols-2 lg:gap-12 items-center py-10 sm:py-14 md:py-20">
          <div className="space-y-6 text-center lg:text-left">
            <Badge
              variant="outline"
              className="gap-2 rounded px-3 py-1.5 text-xs border-foreground/20 bg-foreground/5 text-foreground dark:bg-foreground/10"
            >
              <IconSparkles className="h-3.5 w-3.5" />
              Service sécurisé et vérifié
            </Badge>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-balance">
              Envoyez vos colis entre l'Europe et l'Afrique
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Covalisage international rapide, sécurisé et économique pour la France et le Bénin.
            </p>

            <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-3 py-1.5 rounded">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-foreground">
                Actuellement disponible entre la France et le Bénin
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild>
                <Link href="/register">
                  Commencer gratuitement
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/recherche">
                  <IconMapPin className="h-4 w-4" />
                  Rechercher un trajet
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative order-first lg:order-last hidden sm:block">
            <div className="relative w-full max-w-[220px] sm:max-w-[320px] md:max-w-sm mx-auto">
              <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted/40">
                <Image
                  src="/images/illustrations/envoi-colis.svg"
                  alt="Envoi de colis France-Bénin"
                  width={520}
                  height={520}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="container-wide">
          <div className="text-center space-y-3 mb-10">
            <Badge variant="outline" className="text-xs uppercase tracking-wide rounded">
              Nos avantages
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-balance">
              Pourquoi choisir Sendbox ?
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Une solution simple, sécurisée et adaptée aux trajets France-Bénin.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-border">
                  <CardHeader className="space-y-3">
                    <div className="h-9 w-9 rounded border border-border bg-muted/60 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-muted/20">
        <div className="container-wide space-y-8">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="text-xs uppercase tracking-wide rounded">
              Processus simple
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-balance">
              Comment ça marche ?
            </h2>
            <p className="text-base text-muted-foreground">
              Envoyez votre colis en 4 étapes simples.
            </p>
          </div>

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-start lg:items-center">
            <div className="hidden sm:block">
              <div className="max-w-sm mx-auto lg:mx-0">
                <div className="aspect-square overflow-hidden rounded-md border border-border bg-muted/40">
                  <Image
                    src="/images/illustrations/covoiturage.svg"
                    alt="Comment fonctionne le covoiturage de colis"
                    width={520}
                    height={520}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3 border border-border/70 bg-background/70 px-3 py-3 rounded">
                  <span className="flex h-7 w-7 items-center justify-center rounded border border-border bg-muted text-xs font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm sm:text-base">
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-background">
        <div className="container-wide">
          <div className="border border-border bg-muted/20 rounded-md px-6 py-10 text-center space-y-4">
            <Badge variant="secondary" className="gap-2 rounded px-3 py-1.5 text-xs cursor-default">
              <IconSparkles className="h-3.5 w-3.5" />
              Prêt à commencer ?
            </Badge>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-balance">
              Rejoignez une communauté en croissance
            </h2>

            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Créez votre compte et envoyez votre premier colis dès aujourd'hui.
            </p>

            <Button asChild>
              <Link href="/register">
                Créer mon compte
                <IconArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
