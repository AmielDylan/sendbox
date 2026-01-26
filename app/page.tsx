/**
 * Landing Page Sendbox - "Transit Magazine" Design
 * Editorial, dynamic, memorable
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
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
  IconUsers,
  IconTrendingUp,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react'
import { LandingCta } from '@/components/landing/LandingCta'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { PublicFooter } from '@/components/layouts/PublicFooter'

const features = [
  {
    title: 'Tarifs transparents',
    description: 'Économisez jusqu\'à 60% sur vos envois avec des prix fixes et sans surprise.',
    icon: IconCurrencyEuro,
    accent: 'teal',
  },
  {
    title: 'Voyageurs vérifiés',
    description: 'Chaque transporteur vérifié par KYC, avec évaluations et badges de confiance.',
    icon: IconShieldCheck,
    accent: 'emerald',
  },
  {
    title: 'Livraison rapide',
    description: 'Suivez votre colis en temps réel et communiquez directement avec le voyageur.',
    icon: IconClock,
    accent: 'amber',
  },
]

const benefits = {
  travelers: [
    'Rentabilisez vos voyages',
    'Paiement sécurisé garanti',
    'Flexibilité totale',
    'Communauté solidaire',
  ],
  senders: [
    'Prix imbattables',
    'Remise en main propre',
    'Suivi en direct',
    'Support réactif 24/7',
  ],
}

const steps = [
  {
    number: '01',
    title: 'Trouvez votre trajet',
    description: 'Parcourez les annonces de voyageurs sur votre itinéraire France-Bénin.',
    visual: 'search',
  },
  {
    number: '02',
    title: 'Réservez l\'espace',
    description: 'Sélectionnez le voyageur et indiquez les détails de votre colis.',
    visual: 'book',
  },
  {
    number: '03',
    title: 'Remettez en personne',
    description: 'Rencontrez le voyageur et confiez-lui votre colis en toute sécurité.',
    visual: 'handoff',
  },
  {
    number: '04',
    title: 'Suivez la livraison',
    description: 'Recevez des notifications à chaque étape et chattez en direct.',
    visual: 'track',
  },
]

const stats = [
  { value: '2,500+', label: 'Colis livrés' },
  { value: '1,200+', label: 'Utilisateurs actifs' },
  { value: '4.8/5', label: 'Note moyenne' },
]

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <div className="landing-v2 bg-background relative overflow-x-hidden">
      {/* Hero Section - Clean & Focused */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container-wide relative z-10 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-6 animate-fade-in-up">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Transformez chaque{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">voyage</span>
                  <span className="absolute bottom-2 left-0 right-0 h-3 bg-primary/20 -rotate-1"></span>
                </span>
                {' '}en solution d'envoi sécurisée
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                La plateforme de covalisage qui connecte voyageurs et expéditeurs
                pour des envois <span className="text-foreground font-semibold">économiques</span>,
                {' '}<span className="text-foreground font-semibold">rapides</span> et
                {' '}<span className="text-foreground font-semibold">sécurisés</span>.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 lg:gap-8 pt-2">
                {stats.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <LandingCta
                className="flex-wrap sm:flex-nowrap pt-2"
                registerClassName="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300"
                searchClassName="w-full sm:w-auto border-2 hover:bg-accent transition-all duration-300"
              />

              {/* Trust indicator */}
              <div className="flex items-center gap-3 pt-2">
                <IconShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Identités vérifiées • Paiements sécurisés • Support 24/7
                </p>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative hidden lg:block animate-fade-in-up animation-delay-200">
              <Image
                src="/images/hero.png"
                alt="Sendbox - Covalisage international"
                width={600}
                height={600}
                priority
                className="w-full h-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Grid with accent colors */}
      <section className="py-20 sm:py-28 bg-muted/30 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

        <div className="container-wide relative">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold px-4 py-2">
              Nos avantages
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
              Pourquoi <span className="text-primary">Sendbox</span> ?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Une solution pensée pour rendre vos envois simples, sûrs et abordables.
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
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all duration-500"></div>

                  <div className="relative p-8 space-y-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold">
                        {feature.title}
                      </h3>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Pays couverts</h2>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* Active countries */}
              <div className="flex items-center gap-3">
              <div className="group relative">
                <div className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <span className="text-3xl">🇫🇷</span>
                </div>
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  France
                </span>
              </div>

              <div className="group relative">
                <div className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <span className="text-3xl">🇧🇯</span>
                </div>
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Bénin
                </span>
              </div>
            </div>

            {/* Empty state placeholders */}
            <div className="flex items-center gap-3">
              <div className="w-[60px] h-[46px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                <span className="text-sm text-muted-foreground/40">+</span>
              </div>
              <div className="w-[60px] h-[46px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                <span className="text-sm text-muted-foreground/40">+</span>
              </div>
              <div className="w-[60px] h-[46px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 flex items-center justify-center">
                <span className="text-sm text-muted-foreground/40">+</span>
              </div>
            </div>

              <span className="text-sm text-muted-foreground italic">et d'autres à venir</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works - Editorial layout */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/5 to-transparent"></div>

        <div className="container-wide relative">
          <div className="mb-16 animate-fade-in-up">
            <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold px-4 py-2 mb-6">
              Simple & Efficace
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold max-w-3xl">
              4 étapes pour envoyer votre colis
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left: Steps */}
            <div className="space-y-6">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="group flex gap-6 p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-background hover:shadow-xl transition-all duration-500 animate-fade-in-up"
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
              <div className="relative aspect-square max-w-lg mx-auto lg:ml-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-emerald-500/20 rounded-3xl"></div>
                <div className="relative h-full rounded-3xl overflow-hidden border-2 border-border bg-muted/20 p-12">
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

      {/* Benefits - Dual audience */}
      <section className="py-20 sm:py-28 bg-muted/30 relative">
        <div className="container-wide">
          <div className="text-center space-y-4 mb-16 animate-fade-in-up">
            <Badge variant="outline" className="text-xs uppercase tracking-widest font-semibold px-4 py-2">
              Pour tous
            </Badge>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
              Voyageurs & Expéditeurs
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Une communauté gagnant-gagnant où chacun trouve son compte.
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
                    <h3 className="text-3xl font-bold mb-2">Voyageurs</h3>
                    <p className="text-muted-foreground">Rentabilisez vos trajets</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {benefits.travelers.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconCheck className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full sm:w-auto group/btn" variant="outline">
                  <Link href="/register">
                    Devenir transporteur
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
                    <p className="text-muted-foreground">Envoyez malin</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {benefits.senders.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-foreground font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="w-full sm:w-auto group/btn bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/recherche">
                    <IconMapPin className="h-4 w-4" />
                    Rechercher un trajet
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA - Bold & centered */}
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
              Rejoignez la communauté{' '}
              <span className="text-primary">Sendbox</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Des milliers d'utilisateurs font déjà confiance à notre plateforme
              pour leurs envois entre l'Europe et l'Afrique.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300">
                <Link href="/register">
                  Créer mon compte gratuitement
                  <IconArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 border-2 hover:scale-105 transition-all duration-300">
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
                <span>KYC vérifié</span>
              </div>
              <div className="flex items-center gap-2">
                <IconUsers className="h-5 w-5 text-primary" />
                <span>1,200+ membres</span>
              </div>
              <div className="flex items-center gap-2">
                <IconTrendingUp className="h-5 w-5 text-primary" />
                <span>4.8/5 étoiles</span>
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
