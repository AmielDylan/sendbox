/**
 * Landing Page Sendbox — SaaS Voyageurs Pro
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  IconShieldCheck,
  IconArrowRight,
  IconCurrencyEuro,
  IconClock,
  IconSparkles,
  IconPlane,
  IconPackage,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react'
import { LandingCta } from '@/components/landing/LandingCta'
import { TrustStatsBlock } from '@/components/landing/TrustStatsBlock'
import { PricingSection } from '@/components/landing/PricingSection'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { PublicFooter } from '@/components/layouts/PublicFooter'

const features = [
  {
    title: 'Profil vérifié',
    description:
      "Vérification d'identité + billet de voyage joint à chaque annonce. Votre badge de confiance est visible de tous les expéditeurs.",
    icon: IconShieldCheck,
    accent: 'teal',
  },
  {
    title: 'Paiements sécurisés',
    description:
      "L'argent est retenu jusqu'à la livraison. Vous touchez votre commission automatiquement dès confirmation — aucun risque d'impayé.",
    icon: IconCurrencyEuro,
    accent: 'emerald',
  },
  {
    title: 'Tableau de bord pro',
    description:
      "Gérez vos trajets, suivez vos revenus et acceptez les demandes depuis un espace pensé pour les voyageurs qui font ça vraiment.",
    icon: IconSparkles,
    accent: 'amber',
  },
]

const benefits = {
  travelers: [
    'Profil professionnel avec badge de confiance',
    'Commission garantie, versée automatiquement',
    'Gestion intuitive de vos trajets et revenus',
    'Communauté de confiance où chacun trouve son compte',
  ],
  senders: [
    'Voyageurs tous vérifiés (identité + billet)',
    "Paiement sécurisé (retenu jusqu'à livraison)",
    'Suivi QR code de votre envoi',
    'Litige possible avant libération des fonds',
  ],
}

const steps = [
  {
    number: '01',
    title: 'Créez votre profil pro',
    description:
      "Vérifiez votre identité et ajoutez votre compte bancaire pour recevoir vos paiements. Une seule fois, c'est bon.",
    visual: 'search',
  },
  {
    number: '02',
    title: 'Publiez un trajet',
    description:
      "Joignez votre billet de voyage (informations anonymisées). Ça prouve que vous voyagez vraiment — et ça rassure les expéditeurs.",
    visual: 'book',
  },
  {
    number: '03',
    title: 'Acceptez une demande',
    description:
      "Consultez les demandes d'envoi et donnez votre accord. Le paiement est retenu sur la plateforme jusqu'à la livraison.",
    visual: 'handoff',
  },
  {
    number: '04',
    title: 'Livrez & touchez votre commission',
    description:
      'Livraison confirmée → paiement automatique sur votre compte. Aucune démarche supplémentaire.',
    visual: 'track',
  },
]

const senderSteps = [
  {
    number: '01',
    title: 'Trouvez un voyageur vérifié',
    description:
      "Tous les voyageurs Sendbox ont une identité vérifiée et ont uploadé leur billet de voyage.",
    visual: 'search',
  },
  {
    number: '02',
    title: 'Réservez et payez',
    description:
      "Paiement sécurisé. L'argent est retenu sur la plateforme jusqu'à la livraison.",
    visual: 'book',
  },
  {
    number: '03',
    title: 'Suivez votre envoi',
    description:
      "Un QR code unique est attribué à votre envoi. Retrouvez son statut en quelques secondes depuis l'application.",
    visual: 'handoff',
  },
  {
    number: '04',
    title: 'Confirmez la livraison',
    description:
      "Livraison ok → libération du paiement. Un problème ? Ouvrez un litige avant la libération.",
    visual: 'track',
  },
]

export default function HomePage() {
  const [stepMode, setStepMode] = useState<'traveler' | 'sender'>('traveler')
  const displayedSteps = stepMode === 'traveler' ? steps : senderSteps
  return (
    <>
      <PublicHeader />
      <div className="landing-v2 bg-background relative overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[calc(100dvh-4rem)] flex items-center bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container-wide relative z-10 py-16 sm:py-20 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left: Content */}
              <div className="space-y-6 animate-fade-in-up">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  La plateforme des{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-primary">
                      voyageurs professionnels
                    </span>
                    <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1"></span>
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Publiez vos trajets, acceptez des envois vérifiés, touchez
                  votre commission.{' '}
                  <span className="text-foreground font-semibold">
                    En toute sécurité.
                  </span>
                </p>

                {/* CTA */}
                <LandingCta
                  className="flex-wrap sm:flex-nowrap pt-2"
                  registerClassName="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                />
              </div>

              {/* Right: Hero Image */}
              <div className="relative mt-10 flex justify-center lg:mt-0 lg:block animate-fade-in-up animation-delay-200">
                <Image
                  src="/images/hero.png"
                  alt="Sendbox — Covalisage professionnel"
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto max-w-none rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-28 bg-muted/30 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

          <div className="container-wide relative">
            <div className="text-center space-y-4 mb-16 animate-fade-in-up">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
              >
                Nos avantages
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                Pourquoi <span className="text-primary">Sendbox</span> ?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Une plateforme pensée pour les voyageurs qui font du covalisage
                sérieusement.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <Card
                    key={feature.title}
                    className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 bg-background animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500"></div>

                    <div className="relative p-8 space-y-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
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

        {/* Pays couverts Section */}
        <section className="py-12 border-y bg-muted/20">
          <div className="container-wide">
            <div className="flex flex-col items-center justify-center gap-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Pays couverts
              </h2>

              <div className="flex flex-wrap items-center justify-center gap-6">
                {/* Active countries */}
                <div className="flex items-center gap-3">
                  <div className="group relative">
                    <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <span className="text-xl">🇫🇷</span>
                    </div>
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      France
                    </span>
                  </div>

                  <div className="group relative">
                    <div className="px-2.5 py-1.5 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-md">
                      <span className="text-xl">🇧🇯</span>
                    </div>
                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Bénin
                    </span>
                  </div>
                </div>

                {/* Empty state placeholders */}
                <div className="flex items-center gap-3">
                  <div className="w-[32px] h-[26px] rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/30">+</span>
                  </div>
                  <div className="w-[32px] h-[26px] rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/30">+</span>
                  </div>
                  <div className="w-[32px] h-[26px] rounded-lg border border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/30">+</span>
                  </div>
                </div>

                <span className="text-sm text-muted-foreground italic">
                  et d'autres à venir
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 sm:py-28 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent"></div>

          <div className="container-wide relative">
            <div className="mb-16 animate-fade-in-up">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-widest font-semibold px-4 py-2 mb-6"
              >
                Simple & Efficace
              </Badge>
              <div className="flex flex-col gap-6">
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold max-w-3xl">
                  Comment ça marche en 4 étapes
                </h2>
                <div className="flex gap-3">
                  <Button
                    variant={stepMode === 'traveler' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStepMode('traveler')}
                    className="rounded-full"
                  >
                    Je voyage
                  </Button>
                  <Button
                    variant={stepMode === 'sender' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStepMode('sender')}
                    className="rounded-full"
                  >
                    J'envoie
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              {/* Left: Steps */}
              <div className="space-y-6">
                {displayedSteps.map((step, i) => (
                  <div
                    key={step.number}
                    className="group flex gap-6 p-5 rounded-2xl border-2 border-border hover:border-primary/50 bg-background hover:shadow-xl transition-all duration-500 animate-fade-in-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                        <span className="text-2xl font-bold text-primary group-hover:text-primary-foreground transition-colors duration-500">
                          {step.number}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Visual */}
              <div className="relative animate-fade-in-up animation-delay-300">
                <div className="relative aspect-square max-w-xs sm:max-w-lg mx-auto lg:ml-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-emerald-500/20 rounded-3xl"></div>
                  <div className="relative h-full rounded-3xl overflow-hidden border-2 border-border bg-muted/20 p-6 sm:p-12">
                    <Image
                      src="/images/illustrations/covoiturage.svg"
                      alt="Processus de covalisage"
                      width={500}
                      height={500}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustStatsBlock />
        <PricingSection />

        {/* Benefits - Dual audience */}
        <section className="py-20 sm:py-28 bg-muted/30 relative">
          <div className="container-wide">
            <div className="text-center space-y-4 mb-16 animate-fade-in-up">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
              >
                Voyageurs & Expéditeurs
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                Voyageurs Pro & Expéditeurs
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Une communauté de confiance où chacun trouve son compte.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Travelers */}
              <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 bg-background group animate-fade-in-up">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative p-8 sm:p-10 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconPlane className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-2">Voyageurs Pro</h3>
                      <p className="text-muted-foreground">
                        Transformez vos voyages en revenus.
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {benefits.travelers.map(benefit => (
                      <li key={benefit} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconCheck className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground font-medium">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="w-full sm:w-auto group/btn"
                    variant="outline"
                  >
                    <Link href="/register">
                      Rejoindre Sendbox
                      <IconArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Senders */}
              <Card className="relative overflow-hidden border-2 hover:border-emerald-500/50 transition-all duration-500 bg-background group animate-fade-in-up animation-delay-100">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative p-8 sm:p-10 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <IconPackage className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-2">Expéditeurs</h3>
                      <p className="text-muted-foreground">Envoyez en confiance.</p>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {benefits.senders.map(benefit => (
                      <li key={benefit} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <IconCheck className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-foreground font-medium">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className="w-full sm:w-auto group/btn bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Link href="/sendbox">
                      <IconPackage className="h-4 w-4" />
                      Envoyer avec Sendbox
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>

          <div className="container-wide relative">
            <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <IconSparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Prêt à commencer ?</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
                Rejoignez les voyageurs pro{' '}
                <span className="text-primary">Sendbox</span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Inscription gratuite. Commencez à publier dès 4,99 €/mois.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
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
                  className="w-full sm:w-auto text-base px-8 py-6 border-2 hover:scale-105 transition-all duration-300"
                >
                  <Link href="/recherche">
                    <IconMapPin className="h-5 w-5" />
                    Explorer les trajets
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5 text-primary" />
                  <span>Identité vérifiée</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconPlane className="h-5 w-5 text-primary" />
                  <span>Billet validé par trajet</span>
                </div>
                <div className="flex items-center gap-2">
                  <IconShieldCheck className="h-5 w-5 text-primary" />
                  <span>Paiements sécurisés</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </>
  )
}
