/**
 * Landing Page Sendbox — Teranga Design
 * Marketplace France-Bénin : voyageurs professionnels & expéditeurs
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconShieldCheck,
  IconArrowRight,
  IconCurrencyEuro,
  IconSparkles,
  IconPlane,
  IconPackage,
  IconCheck,
  IconClock,
  IconMapPin,
} from '@tabler/icons-react'
import { TrustStatsBlock } from '@/components/landing/TrustStatsBlock'
import { PricingSection } from '@/components/landing/PricingSection'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { PublicFooter } from '@/components/layouts/PublicFooter'

const travelerSteps = [
  {
    n: '01',
    title: 'Créez votre profil pro',
    desc: "Vérifiez votre identité et ajoutez votre compte bancaire. Une seule fois, c'est bon.",
  },
  {
    n: '02',
    title: 'Publiez un trajet',
    desc: 'Joignez votre billet de voyage. Ça prouve que vous voyagez vraiment — et ça rassure les expéditeurs.',
  },
  {
    n: '03',
    title: 'Acceptez une demande',
    desc: "Consultez les demandes d'envoi. Le paiement est retenu sur la plateforme jusqu'à la livraison.",
  },
  {
    n: '04',
    title: 'Livrez & touchez votre commission',
    desc: 'Livraison confirmée → paiement automatique sur votre compte. Aucune démarche supplémentaire.',
  },
]

const senderSteps = [
  {
    n: '01',
    title: 'Trouvez un voyageur vérifié',
    desc: "Identité vérifiée et billet uploadé pour chaque voyageur disponible sur la plateforme.",
  },
  {
    n: '02',
    title: 'Réservez et payez',
    desc: "Paiement sécurisé. L'argent est retenu sur la plateforme jusqu'à la livraison confirmée.",
  },
  {
    n: '03',
    title: 'Suivez votre envoi',
    desc: "Un QR code unique est attribué à votre envoi. Statut accessible en temps réel depuis l'application.",
  },
  {
    n: '04',
    title: 'Confirmez la livraison',
    desc: "Livraison ok → paiement libéré. Un problème ? Ouvrez un litige avant la libération des fonds.",
  },
]

export default function HomePage() {
  const [mode, setMode] = useState<'traveler' | 'sender'>('traveler')
  const steps = mode === 'traveler' ? travelerSteps : senderSteps
  const isTraveler = mode === 'traveler'

  return (
    <>
      <PublicHeader />
      <div className="landing bg-background overflow-x-hidden">

        {/* ── Hero ── */}
        <section className="relative min-h-[calc(100dvh-4rem)] flex items-center bg-noise">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="container-wide relative z-10 py-16 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left: Copy */}
              <div className="space-y-7 animate-fade-in-up">
                <Badge
                  variant="outline"
                  className="text-xs uppercase tracking-widest font-semibold px-4 py-2 gap-2 w-fit"
                >
                  <span className="text-base leading-none">🇫🇷</span>
                  France → Bénin
                  <span className="text-base leading-none">🇧🇯</span>
                </Badge>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-bold leading-[1.05] tracking-tight">
                  La marketplace
                  <br />
                  du covalisage
                  <br />
                  <span className="text-primary">France–Bénin.</span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
                  Voyageurs, publiez vos trajets et recevez des demandes
                  d'expéditeurs. Expéditeurs, trouvez un voyageur vérifié pour
                  vos envois.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  >
                    <Link href="/register">
                      <IconPlane className="h-4 w-4" />
                      Je transporte
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="gap-2 border-2 hover:border-amber hover:text-amber transition-colors"
                  >
                    <Link href="/sendbox">
                      <IconPackage className="h-4 w-4" />
                      J'envoie un colis
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-5 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <IconShieldCheck className="h-3.5 w-3.5 text-primary" stroke={1.5} />
                    Voyageurs vérifiés
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconCurrencyEuro className="h-3.5 w-3.5 text-primary" stroke={1.5} />
                    Paiement sécurisé
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconClock className="h-3.5 w-3.5 text-primary" stroke={1.5} />
                    Sous 48h garanti
                  </span>
                </div>
              </div>

              {/* Right: Hero image + floating route badge */}
              <div className="relative flex justify-center lg:justify-end animate-fade-in-up animation-delay-200">
                <div className="relative w-full max-w-lg">
                  <Image
                    src="/images/hero.png"
                    alt="Sendbox — Covalisage France-Bénin"
                    width={600}
                    height={600}
                    priority
                    className="w-full h-auto rounded-2xl"
                  />

                  {/* Floating route card */}
                  <div className="absolute left-4 -bottom-5 sm:left-0 sm:-bottom-6 bg-card border border-border/80 rounded-xl shadow-2xl p-4 sm:p-5 w-56 sm:w-64">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Trajet en cours
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🇫🇷</span>
                      <div className="flex-1 relative h-4 flex items-center">
                        <div className="h-px w-full bg-border" />
                        <div
                          className="absolute h-px bg-primary/60"
                          style={{ width: '65%', left: 0 }}
                        />
                        <span className="absolute text-sm -top-1.5" style={{ left: '60%' }}>
                          ✈
                        </span>
                      </div>
                      <span className="text-xl">🇧🇯</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">Paris</span>
                      <span className="text-[10px] text-muted-foreground">Cotonou</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Délai estimé</span>
                      <span className="text-xs font-semibold text-primary">Sous 48h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Dual Profiles ── */}
        <section className="py-20 sm:py-28">
          <div className="container-wide">
            <div className="text-center space-y-3 mb-14 animate-fade-in-up">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
              >
                Deux profils, une plateforme
              </Badge>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                Fait pour vous, quel que soit votre rôle.
              </h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Une communauté de confiance où voyageurs et expéditeurs se retrouvent.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Voyageurs — teal identity */}
              <div className="group relative rounded-2xl border-2 border-border hover:border-primary/50 bg-card overflow-hidden p-8 sm:p-10 space-y-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <div className="absolute top-0 inset-x-0 h-1 bg-primary/40 group-hover:bg-primary rounded-t-2xl transition-colors" />
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <IconPlane className="h-6 w-6 text-primary" stroke={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                      Voyageurs Pro
                    </p>
                    <h3 className="text-2xl font-bold leading-tight">
                      Transformez vos trajets
                      <br />
                      en revenus.
                    </h3>
                  </div>
                </div>
                <ul className="space-y-3.5">
                  {[
                    'Profil professionnel avec badge de confiance',
                    'Commission garantie, versée automatiquement',
                    'Gestion intuitive de vos trajets et revenus',
                    'Communauté vérifiée et espace pro dédié',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconCheck className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="gap-2 group/btn">
                  <Link href="/register">
                    Rejoindre Sendbox
                    <IconArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Expéditeurs — amber identity */}
              <div className="group relative rounded-2xl border-2 border-border hover:border-amber/50 bg-card overflow-hidden p-8 sm:p-10 space-y-6 transition-all duration-300 hover:shadow-xl hover:shadow-amber/5">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber/40 group-hover:bg-amber rounded-t-2xl transition-colors" />
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber/15 transition-colors">
                    <IconPackage className="h-6 w-6 text-amber" stroke={1.5} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-amber font-semibold mb-1">
                      Expéditeurs
                    </p>
                    <h3 className="text-2xl font-bold leading-tight">
                      Envoyez en toute
                      <br />
                      confiance.
                    </h3>
                  </div>
                </div>
                <ul className="space-y-3.5">
                  {[
                    'Voyageurs tous vérifiés (identité + billet)',
                    "Paiement sécurisé, retenu jusqu'à la livraison",
                    'Suivi QR code de votre envoi en temps réel',
                    'Litige possible avant libération des fonds',
                  ].map(b => (
                    <li key={b} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-amber/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconCheck className="h-3 w-3 text-amber" />
                      </div>
                      <span className="text-sm text-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-2 hover:border-amber hover:text-amber hover:bg-amber/5 transition-colors"
                >
                  <Link href="/sendbox">
                    <IconPackage className="h-4 w-4" />
                    Envoyer avec Sendbox
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-20 sm:py-28 bg-muted/30">
          <div className="container-wide">
            <div className="mb-12">
              <Badge
                variant="outline"
                className="text-xs uppercase tracking-widest font-semibold px-4 py-2 mb-5 block w-fit"
              >
                Simple & Efficace
              </Badge>
              <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8">
                <h2 className="font-display text-3xl sm:text-4xl font-bold flex-shrink-0">
                  Comment ça marche
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('traveler')}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                      isTraveler
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    )}
                  >
                    Je voyage
                  </button>
                  <button
                    onClick={() => setMode('sender')}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-all border',
                      !isTraveler
                        ? 'bg-amber text-amber-foreground border-amber shadow-sm'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-amber/40'
                    )}
                  >
                    J'envoie
                  </button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {steps.map((step, i) => (
                <div
                  key={step.n}
                  className={cn(
                    'group flex gap-5 p-5 sm:p-6 rounded-xl border bg-card transition-all duration-300 animate-fade-in-up',
                    isTraveler
                      ? 'border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
                      : 'border-border hover:border-amber/30 hover:shadow-lg hover:shadow-amber/5'
                  )}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                      isTraveler
                        ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                        : 'bg-amber/10 text-amber group-hover:bg-amber group-hover:text-amber-foreground'
                    )}
                  >
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustStatsBlock />
        <PricingSection />

        {/* ── Final CTA ── */}
        <section className="py-24 sm:py-32 relative overflow-hidden bg-noise">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber/5 pointer-events-none" />

          <div className="container-wide relative text-center space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium mx-auto">
              <IconSparkles className="h-4 w-4 text-primary" stroke={1.5} />
              Prêt à commencer ?
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold max-w-2xl mx-auto leading-tight">
              Rejoignez la communauté{' '}
              <span className="text-primary">Sendbox</span>.
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
              Inscription gratuite. 14 jours d'essai. Publiez dès aujourd'hui.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base px-8 gap-2 shadow-xl shadow-primary/20"
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
                className="w-full sm:w-auto text-base px-8 gap-2 border-2"
              >
                <Link href="/recherche">
                  <IconMapPin className="h-5 w-5" />
                  Explorer les trajets
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <IconShieldCheck className="h-4 w-4 text-primary" stroke={1.5} />
                Identité vérifiée
              </span>
              <span className="flex items-center gap-2">
                <IconPlane className="h-4 w-4 text-primary" stroke={1.5} />
                Billet validé par trajet
              </span>
              <span className="flex items-center gap-2">
                <IconShieldCheck className="h-4 w-4 text-primary" stroke={1.5} />
                Paiements sécurisés
              </span>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </>
  )
}
