'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowRight,
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconUserCheck,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { LandingCta } from '@/components/landing/LandingCta'
import { LatestAnnouncementsCarousel } from '@/components/landing/LatestAnnouncementsCarousel'
import { PricingSection } from '@/components/landing/PricingSection'

const features = [
  {
    title: 'Mise en relation claire',
    description:
      "Des frais de mise en relation sont réglés par l'expéditeur à la confirmation mutuelle. Le transport se règle directement entre les parties.",
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
  {
    label: 'France',
    flagBackground:
      'linear-gradient(90deg, #002395 0 33.33%, #ffffff 33.33% 66.66%, #ed2939 66.66% 100%)',
  },
  {
    label: 'Bénin',
    flagBackground:
      'linear-gradient(90deg, #008751 0 40%, transparent 40% 100%), linear-gradient(180deg, #fcd116 0 50%, #e8112d 50% 100%)',
  },
]

const upcomingCountries = [
  {
    label: 'Togo',
    flagBackground:
      'linear-gradient(180deg, #006a4e 0 20%, #ffce00 20% 40%, #006a4e 40% 60%, #ffce00 60% 80%, #006a4e 80% 100%)',
  },
  {
    label: "Côte d'Ivoire",
    flagBackground:
      'linear-gradient(90deg, #f77f00 0 33.33%, #ffffff 33.33% 66.66%, #009e60 66.66% 100%)',
  },
  {
    label: 'Sénégal',
    flagBackground:
      'linear-gradient(90deg, #00853f 0 33.33%, #fdef42 33.33% 66.66%, #e31b23 66.66% 100%)',
  },
]

const steps = [
  {
    title: 'Créer son profil vérifié',
    description: "KYC obligatoire à l'inscription",
  },
  {
    title: 'Trouver un voyageur ou annoncer son trip',
    description: 'Recherche par corridor et date',
  },
  {
    title: 'Confirmer la mise en relation',
    description: 'Les deux parties confirment',
  },
  {
    title: 'Remise + livraison avec photo',
    description: 'Horodatée par le serveur, confirmée par les deux',
  },
  {
    title: 'Évaluation mutuelle',
    description: 'Avis simultanés et immuables',
  },
]

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Combien coûte Sendbox ?',
    answer:
      "Des frais de mise en relation sont réglés par l'expéditeur à la confirmation mutuelle. L'utilisation est entièrement gratuite pour les voyageurs. Le montant du transport se négocie directement entre les parties, hors plateforme.",
  },
  {
    question: 'Comment sont vérifiés les profils ?',
    answer:
      "Chaque utilisateur passe par un KYC obligatoire : pièce d'identité + selfie de vérification. Les profils non vérifiés ne peuvent pas publier d'annonces ni finaliser de mise en relation.",
  },
  {
    question: 'Que se passe-t-il si mon colis est endommagé ou perdu ?',
    answer:
      "Sendbox est une plateforme de mise en relation et n'assure pas le transport. Cependant, des photos horodatées par le serveur sont prises à la remise et à la livraison, confirmées par les deux parties et conservées 12 mois comme preuves en cas de litige.",
  },
  {
    question: 'Comment fonctionne le paiement du transport ?',
    answer:
      "Le montant du transport se règle directement entre l'expéditeur et le voyageur, selon les modalités que vous convenez ensemble. Sendbox facture uniquement des frais de mise en relation à la confirmation.",
  },
  {
    question: 'Puis-je annuler une mise en relation ?',
    answer:
      'Avant la confirmation mutuelle des deux parties, la mise en relation peut être annulée sans frais. Une fois les deux parties confirmées, les frais de mise en relation sont prélevés et la mise en relation est effective.',
  },
  {
    question: 'Dans quels pays Sendbox est-il disponible ?',
    answer:
      "Sendbox est actuellement actif sur le corridor France-Bénin. Des extensions vers le Togo, la Côte d'Ivoire et le Sénégal sont en cours de préparation.",
  },
  {
    question: 'Comment fonctionnent les avis ?',
    answer:
      'Les avis sont laissés simultanément par les deux parties après la livraison : le principe des notes en aveugle empêche toute influence mutuelle. Ils sont immuables une fois publiés et contribuent au score de confiance public du profil.',
  },
  {
    question: 'Mes données personnelles sont-elles protégées ?',
    answer:
      "Vos données sont hébergées en Europe. Les documents KYC sont chiffrés et accessibles uniquement à l'équipe de vérification, avec une durée de conservation limitée conformément au RGPD. Consultez notre politique de confidentialité pour les détails.",
  },
]

const senderBenefits: React.ReactNode[] = [
  'Trouvez un voyageur sur votre corridor diaspora',
  'Confirmez la mise en relation avec un cadre clair',
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
      <section className="relative flex min-h-[68svh] items-center overflow-hidden bg-black text-white sm:min-h-screen">
        <Image
          src="/images/landing/hero-trust-handoff-v2.png"
          alt="Remise de colis entre un expéditeur et un voyageur vérifié"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[86%_top] sm:object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/42 to-black/12 sm:from-black/80 sm:via-black/48 sm:to-black/10" />

        <div className="relative z-10 w-full px-6 pt-16 sm:px-8 sm:py-24 lg:px-24 lg:py-28 xl:px-[6.25rem]">
          <div className="max-w-xl space-y-6 text-left animate-fade-in-up">
            <h1 className="font-display text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
              Transformez chaque voyage en solution d’envoi sécurisée.
            </h1>

            <p className="max-w-xl text-sm leading-6 text-white/82 sm:text-base sm:leading-7">
              Confiez votre colis à un voyageur vérifié, avec une déclaration
              claire, des preuves photo et des avis après livraison.
            </p>

            <LandingCta
              className="flex-wrap pt-2 sm:flex-nowrap"
              registerClassName="bg-white text-black transition-colors hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              searchClassName="border-white/70 bg-transparent text-white transition-colors hover:border-white hover:bg-white/10 hover:text-white dark:text-white dark:hover:text-white"
            />
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
                  className="bg-background transition-colors hover:border-border animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="space-y-4 p-6">
                    <Icon className="h-4 w-4 text-primary/70" />
                    <div className="space-y-2">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
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
                    <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 transition-all duration-300 hover:scale-105 hover:border-border hover:shadow-sm">
                      <span
                        aria-label={country.label}
                        role="img"
                        className="block h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-black/15 sm:h-5 sm:w-7"
                        style={{ background: country.flagBackground }}
                      />
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
                      <span
                        aria-label={country.label}
                        role="img"
                        className="block h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-black/15 sm:h-5 sm:w-7"
                        style={{ background: country.flagBackground }}
                      />
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
            <p className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 text-[oklch(0.35_0.01_286)] dark:text-[oklch(0.72_0.01_286)]">
              Un parcours simple, vérifiable et conçu pour que chacun sache où
              il en est.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="group flex flex-col gap-3 rounded-lg border border-transparent p-4 transition-all duration-300 hover:border-border/50 animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span className="font-display text-4xl font-bold leading-none text-primary/35 transition-colors duration-300 group-hover:text-primary/65 dark:text-white/40 dark:group-hover:text-white/70 sm:text-5xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-semibold leading-snug">{step.title}</h3>
                <p className="text-sm leading-6 text-[oklch(0.35_0.01_286)] dark:text-[oklch(0.72_0.01_286)]">
                  {step.description}
                </p>
              </div>
            ))}
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

      {/* FAQ */}
      <section className="py-24 sm:py-32">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <div className="space-y-4 animate-fade-in-up">
              <Badge
                variant="outline"
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
              >
                FAQ
              </Badge>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Questions fréquentes
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Tout ce que vous devez savoir avant de commencer.
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-lg border border-border/60 px-5 transition-colors hover:border-border data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="py-5 text-left text-sm font-semibold leading-snug hover:no-underline sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

        <div className="container-wide relative">
          <div className="mx-auto max-w-2xl space-y-6 text-center animate-fade-in-up">
            <h2 className="font-display text-2xl font-light tracking-tight sm:text-3xl lg:text-4xl">
              Rejoignez un réseau de voyageurs vérifiés.
            </h2>

            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Créez votre profil vérifié et organisez vos envois en toute
              confiance.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button asChild size="default" className="transition-colors">
                <Link href="/register">
                  Créer mon compte
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="default"
                variant="outline"
                className="transition-colors"
              >
                <Link href="/recherche">Explorer les trajets</Link>
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
    <Card className="bg-background transition-colors hover:border-border">
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
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
