/**
 * Landing Page Sendbox - Design System "Warm Transit"
 * Covalisage international Europe ⇄ Afrique
 */

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  IconPackage,
  IconShieldCheck,
  IconArrowRight,
  IconStar,
  IconCurrencyEuro,
  IconClock,
  IconUsers,
  IconTrendingUp,
  IconMapPin,
  IconSparkles,
} from '@tabler/icons-react'

export default function HomePage() {
  return (
    <div className="bg-gradient-hero bg-noise">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden">
        <div className="container-wide relative z-10 grid gap-12 lg:grid-cols-2 lg:gap-16 items-center py-20 md:py-32">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Badge animé */}
            <div className="animate-fade-in-up stagger-1">
              <Badge
                variant="secondary"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary/20 bg-primary/5 text-primary font-semibold shadow-warm"
              >
                <IconSparkles className="h-4 w-4" />
                <span>Service sécurisé et vérifié</span>
              </Badge>
            </div>

            {/* Headline - Typographie impactante */}
            <div className="animate-fade-in-up stagger-2 space-y-4">
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight text-balance">
                <span className="block bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent">
                  Envoyez vos colis entre
                </span>
                <span className="block mt-3 bg-gradient-to-r from-primary via-[#E67E50] to-secondary bg-clip-text text-transparent">
                  l'Europe et l'Afrique
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="animate-fade-in-up stagger-3 text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed text-balance">
              Covalisage international{' '}
              <span className="text-primary font-semibold">rapide</span>,{' '}
              <span className="text-secondary font-semibold">sécurisé</span> et{' '}
              <span className="text-accent font-semibold">économique</span>
            </p>

            {/* Badge disponibilité actuelle */}
            <div className="animate-fade-in-up stagger-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-sm font-medium text-foreground">
                  Actuellement disponible entre la France et le Bénin
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg rounded-2xl shadow-warm hover:shadow-2xl transition-all duration-300 group bg-primary hover:bg-primary/90"
                >
                  <span>Commencer gratuitement</span>
                  <IconArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/recherche">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-lg rounded-2xl border-2 hover:bg-muted/50 transition-all"
                >
                  <IconMapPin className="mr-2 h-5 w-5" />
                  <span>Rechercher un trajet</span>
                </Button>
              </Link>
            </div>

            {/* Trust Indicators - Design moderne */}
            <div className="animate-fade-in-up stagger-5 flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-background flex items-center justify-center"
                    >
                      <IconUsers className="h-5 w-5 text-primary" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <IconStar className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg">4.8/5</span>
                  </div>
                  <p className="text-sm text-muted-foreground">250+ avis</p>
                </div>
              </div>

              <div className="h-12 w-px bg-border" />

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 flex items-center justify-center">
                  <IconPackage className="h-6 w-6 text-success" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">500+</p>
                  <p className="text-sm text-muted-foreground">colis livrés</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hero Illustration avec effet 3D */}
          <div className="relative order-first lg:order-last">
            <div className="relative w-full max-w-2xl mx-auto">
              {/* Decorative blur elements */}
              <div className="absolute -top-12 -right-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

              {/* Main illustration avec effet float */}
              <div className="relative z-10 animate-float">
                <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border-8 border-background/50 backdrop-blur">
                  <Image
                    src="/images/illustrations/envoi-colis.svg"
                    alt="Envoi de colis France-Bénin"
                    width={700}
                    height={700}
                    priority
                    className="w-full h-auto object-contain scale-110"
                  />
                </div>
              </div>

              {/* Floating stats cards */}
              <div className="absolute -left-4 top-1/4 animate-fade-in-up stagger-3 hidden lg:block">
                <div className="card-elevated p-4 backdrop-blur-xl bg-card/80 max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <IconTrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl">60%</p>
                      <p className="text-xs text-muted-foreground">moins cher</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/3 animate-fade-in-up stagger-4 hidden lg:block">
                <div className="card-elevated p-4 backdrop-blur-xl bg-card/80 max-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                      <IconShieldCheck className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-2xl">100%</p>
                      <p className="text-xs text-muted-foreground">sécurisé</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section - Grid asymétrique */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        <div className="container-wide relative z-10">
          {/* Section header */}
          <div className="text-center space-y-6 mb-16 md:mb-24">
            <Badge variant="outline" className="text-sm px-4 py-2 rounded-full">
              Nos avantages
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-balance">
              Pourquoi choisir{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sendbox
              </span>{' '}
              ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Une solution complète qui combine sécurité, économie et rapidité
            </p>
          </div>

          {/* Features grid - layout asymétrique */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Grand card */}
            <Card className="md:col-span-2 lg:col-span-1 card-elevated border-2 border-primary/10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <IconCurrencyEuro className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">
                  Tarifs compétitifs
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Jusqu'à <span className="text-primary font-bold">60% moins cher</span> que les services traditionnels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {[
                  'Prix négociés directement',
                  'Pas de frais cachés',
                  'Paiement sécurisé'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <IconShieldCheck className="h-3 w-3 text-primary" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="card-elevated border-2 border-secondary/10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <IconShieldCheck className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">
                  100% sécurisé
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Voyageurs vérifiés et assurance incluse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {[
                  'Vérification d\'identité',
                  'Assurance optionnelle',
                  'Support client 7j/7'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <IconShieldCheck className="h-3 w-3 text-secondary" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="md:col-span-2 lg:col-span-1 card-elevated border-2 border-accent/10 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="space-y-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <IconClock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-display">
                  Livraison rapide
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Délais courts et traçabilité en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                {[
                  'Suivi en temps réel',
                  'Notifications instantanées',
                  'Chat direct avec voyageur'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <IconShieldCheck className="h-3 w-3 text-accent" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section - Timeline design */}
      <section className="py-24 md:py-32 bg-gradient-warm relative overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Illustration */}
            <div className="order-2 lg:order-1 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-background/50">
                <Image
                  src="/images/illustrations/covoiturage.svg"
                  alt="Comment fonctionne le covoiturage de colis"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
              </div>

              {/* Decorative element */}
              <div className="absolute -z-10 -right-12 -bottom-12 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl" />
            </div>

            {/* Right: Steps - Timeline verticale */}
            <div className="order-1 lg:order-2 space-y-12">
              <div className="space-y-6">
                <Badge variant="outline" className="text-sm px-4 py-2 rounded-full">
                  Processus simple
                </Badge>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-balance">
                  Comment ça marche ?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Envoyez votre colis en 4 étapes simples
                </p>
              </div>

              {/* Steps avec design moderne */}
              <div className="space-y-8 relative">
                {/* Connecting line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent hidden sm:block" />

                {[
                  {
                    num: 1,
                    title: 'Recherchez un trajet',
                    desc: 'Trouvez un voyageur qui part sur votre trajet France ↔ Bénin',
                    color: 'primary'
                  },
                  {
                    num: 2,
                    title: 'Réservez votre espace',
                    desc: 'Indiquez le poids et décrivez votre colis en détail',
                    color: 'secondary'
                  },
                  {
                    num: 3,
                    title: 'Remettez votre colis',
                    desc: 'Rencontrez le voyageur et confiez-lui votre colis',
                    color: 'accent'
                  },
                  {
                    num: 4,
                    title: 'Suivez la livraison',
                    desc: 'Recevez des notifications et chattez avec le voyageur',
                    color: 'success'
                  }
                ].map((step) => (
                  <div key={step.num} className="flex gap-6 group relative">
                    <div className="flex-shrink-0 relative z-10">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${step.color} to-${step.color}/80 text-white flex items-center justify-center font-display font-bold text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                        {step.num}
                      </div>
                    </div>
                    <div className="space-y-2 flex-1 pt-1">
                      <h3 className="font-display text-xl sm:text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section finale */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 relative overflow-hidden">
        <div className="container-wide relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-10">
            <Badge className="text-sm px-5 py-2.5 rounded-full bg-primary/10 text-primary border-2 border-primary/20">
              <IconSparkles className="h-4 w-4 mr-2" />
              Prêt à commencer ?
            </Badge>

            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-balance">
              Rejoignez des centaines d'utilisateurs satisfaits
            </h2>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Envoyez votre premier colis aujourd'hui et découvrez une nouvelle façon d'envoyer vos colis
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-16 px-12 text-xl rounded-2xl shadow-warm hover:shadow-2xl transition-all duration-300 group bg-primary hover:bg-primary/90"
                >
                  <span>Créer mon compte</span>
                  <IconArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
