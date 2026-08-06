'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconCamera,
  IconCheck,
  IconCircleCheck,
  IconUserCheck,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
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
    title: 'Identité vérifiée avant publication',
    description:
      'Vous savez avec qui vous échangez avant d’aller plus loin.',
    icon: IconUserCheck,
  },
  {
    title: 'Colis déclaré avant accord',
    description:
      'Le voyageur consulte le contenu annoncé avant d’accepter.',
    icon: IconCircleCheck,
  },
  {
    title: 'Photos à la remise et à la livraison',
    description:
      'Des preuves simples complètent les échanges entre les parties.',
    icon: IconCamera,
  },
  {
    title: 'Avis partagés après l’envoi',
    description:
      'La réputation se construit à partir des expériences réalisées.',
    icon: IconCheck,
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

const steps = [
  {
    title: 'Profil et trajet',
    description:
      'Vérifiez votre identité, puis trouvez un voyageur ou publiez vos dates.',
  },
  {
    title: 'Demande et déclaration',
    description: 'Partagez le contenu du colis avant que chacun décide.',
  },
  {
    title: 'Accord mutuel',
    description:
      'Chacun confirme. L’expéditeur règle uniquement les frais Sendbox.',
  },
  {
    title: 'Preuves et avis',
    description:
      'Ajoutez les photos utiles, puis laissez un avis après l’envoi.',
  },
]

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Combien coûte Sendbox ?',
    answer:
      "Des frais de mise en relation sont réglés par l'expéditeur après confirmation mutuelle. L'utilisation est gratuite pour les voyageurs. Le montant du transport se négocie directement entre les parties, hors plateforme.",
  },
  {
    question: 'Comment sont vérifiés les profils ?',
    answer:
      "Chaque utilisateur passe par une vérification d'identité. Les profils non vérifiés ne peuvent pas publier d'annonces ni finaliser de mise en relation.",
  },
  {
    question: 'Que se passe-t-il si mon colis est endommagé ou perdu ?',
    answer:
      "Sendbox est une plateforme de mise en relation et n'assure pas le transport. Des photos horodatées sont prises à la remise et à la livraison pour garder une trace utile en cas de désaccord.",
  },
  {
    question: 'Comment fonctionne le paiement du transport ?',
    answer:
      "Le montant du transport se règle directement entre l'expéditeur et le voyageur, selon les modalités que vous convenez ensemble. Sendbox facture uniquement les frais de mise en relation confirmée.",
  },
  {
    question: 'Puis-je annuler une mise en relation ?',
    answer:
      'Avant la confirmation mutuelle des deux parties, la mise en relation peut être annulée sans frais. Une fois les deux parties confirmées, les frais de mise en relation sont prélevés et la mise en relation est effective.',
  },
  {
    question: 'Dans quels pays Sendbox est-il disponible ?',
    answer:
      "Sendbox est actuellement actif sur le premier corridor France-Bénin. L'objectif est d'ouvrir progressivement d'autres corridors après les premiers retours utilisateurs.",
  },
  {
    question: 'Comment fonctionnent les avis ?',
    answer:
      'Les avis sont laissés par les deux parties après la livraison. Ils deviennent visibles ensemble et aident les prochains utilisateurs à se faire une idée plus juste.',
  },
  {
    question: 'Mes données personnelles sont-elles protégées ?',
    answer:
      "Vos données sont hébergées en Europe. Les documents de vérification sont protégés et accessibles uniquement à l'équipe chargée des contrôles. Consultez notre politique de confidentialité pour les détails.",
  },
]

const senderBenefits: React.ReactNode[] = [
  'Trajet et dates visibles avant échange',
  'Contenu déclaré avant acceptation',
  'Preuves de remise et de livraison',
]

const travelerBenefits = [
  'Dates et capacité maîtrisées',
  'Demandes détaillées avant accord',
  'Utilisation gratuite pour le voyageur',
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
          className="translate-y-5 object-cover object-[86%_top] sm:translate-y-0 sm:object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/42 to-black/12 sm:from-black/80 sm:via-black/48 sm:to-black/10" />

        <div className="relative z-10 w-full px-6 pt-16 sm:px-8 sm:py-24 lg:px-24 lg:py-28 xl:px-[6.25rem]">
          <div className="max-w-xl space-y-6 text-left animate-fade-in-up">
            <h1 className="font-display text-3xl font-light leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
              Transformez chaque voyage en solution d’envoi sécurisée.
            </h1>

            <p className="max-w-xl text-sm leading-6 text-white/82 sm:text-base sm:leading-7">
              Trouvez un voyageur vérifié, déclarez votre colis et gardez des
              preuves à la remise comme à la livraison.
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
      <section className="relative bg-muted/30 py-16 sm:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

        <div className="container-wide relative">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-16">
            <div className="hidden animate-fade-in-up lg:block">
              <div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-lg border border-border/60 bg-background lg:mx-0">
                <Image
                  src="/images/landing/commitments-evidence.webp"
                  alt="Colis déclaré, identité, trajet, preuve photo et avis"
                  fill
                  sizes="(min-width: 1024px) 52vw, 92vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-8 animate-fade-in-up">
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Ce qui rend l’échange plus sûr.
                </h2>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                  Avant d’accepter, chacun voit l’essentiel : le profil, le
                  contenu déclaré et les informations du trajet.
                </p>
              </div>

              <div className="divide-y divide-border/70 border-y border-border/70">
                {features.map((feature, i) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="grid grid-cols-[1.5rem_1fr] gap-4 py-5 animate-fade-in-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 text-primary"
                      />
                      <div className="space-y-1.5">
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corridor */}
      <section className="border-y bg-background py-4">
        <div className="container-wide">
          <div className="flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground sm:flex-row sm:gap-4">
            <span className="font-semibold text-foreground">
              Premier corridor actif
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {activeCountries.map(country => (
                <span key={country.label} className="flex items-center gap-2">
                  <span
                    aria-label={country.label}
                    role="img"
                    className="block h-4 w-6 rounded-[2px] ring-1 ring-black/15"
                    style={{ background: country.flagBackground }}
                  />
                  <span>{country.label}</span>
                </span>
              ))}
            </div>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <span>D’autres corridors ouvriront progressivement.</span>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-24 sm:py-32">
        <div className="container-wide space-y-12">
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Un envoi clair, étape par étape.
            </h2>
            <p className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 text-[oklch(0.35_0.01_286)] dark:text-[oklch(0.72_0.01_286)]">
              Vous gardez la main à chaque étape. Sendbox cadre la mise en
              relation et conserve les preuves utiles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`group flex min-h-[14rem] flex-col justify-between rounded-lg border p-5 transition-colors animate-fade-in-up ${
                  index === 2
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/70 bg-background hover:border-border'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="space-y-4">
                  <span
                    className={`font-display text-4xl font-bold leading-none ${
                      index === 2 ? 'text-white/45' : 'text-primary/45'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <p
                      className={`text-sm leading-6 ${
                        index === 2
                          ? 'text-primary-foreground/82'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Le transport est convenu et réglé directement entre l’expéditeur et
            le voyageur, hors Sendbox.
          </p>
        </div>
      </section>

      {/* Pour qui */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="container-wide">
          <div className="space-y-10">
            <div className="max-w-2xl space-y-4 animate-fade-in-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Deux façons d’utiliser Sendbox.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Même cadre, actions différentes : chacun avance avec les
                informations utiles avant de confirmer.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AudienceSection
                eyebrow="Pour les expéditeurs"
                title="Envoyer sans confier son colis au hasard."
                description="Consultez les trajets, choisissez un profil vérifié et partagez les détails du colis avant accord."
                benefits={senderBenefits}
                cta="Chercher un voyageur"
                href="/recherche"
              />
              <AudienceSection
                eyebrow="Pour les voyageurs"
                title="Voyager avec une demande claire."
                description="Publiez vos disponibilités, consultez le contenu et acceptez seulement ce que vous pouvez transporter sereinement."
                benefits={travelerBenefits}
                cta="Publier mon trajet"
                href="/dashboard/annonces/new"
                dark
              />
            </div>
          </div>
        </div>
      </section>

      <PricingSection />
      <LatestAnnouncementsCarousel />

      {/* FAQ */}
      <section className="py-24 sm:py-32">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Vos questions avant de commencer.
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
                  className="border-b border-border/70 px-0 transition-colors data-[state=open]:border-primary/30"
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
      <section className="py-20 sm:py-24">
        <div className="container-wide">
          <div className="grid gap-8 rounded-lg bg-primary p-6 text-primary-foreground animate-fade-in-up sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Prêt à organiser un premier envoi ?
              </h2>

              <p className="text-sm leading-6 text-primary-foreground/82 sm:text-base sm:leading-7">
                Créez votre profil, vérifiez votre identité et commencez sur le
                premier corridor France-Bénin.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="default" className="transition-colors">
                <Link href="/register">Envoyer un colis</Link>
              </Button>

              <Button
                asChild
                size="default"
                variant="outline"
                className="border-primary-foreground/60 bg-transparent text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary"
              >
                <Link href="/dashboard/annonces/new">Publier un trajet</Link>
              </Button>
            </div>
            <p className="text-xs text-primary-foreground/70 lg:col-start-2 lg:text-right">
              Transport réglé directement entre particuliers.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function AudienceSection({
  eyebrow,
  title,
  description,
  benefits,
  cta,
  href,
  dark = false,
}: {
  eyebrow: string
  title: string
  description: string
  benefits: React.ReactNode[]
  cta: string
  href: string
  dark?: boolean
}) {
  return (
    <div
      className={`flex min-h-[20rem] flex-col justify-between rounded-lg border p-6 animate-fade-in-up sm:p-7 ${
        dark
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/70 bg-background'
      }`}
    >
      <div className="space-y-5">
        <p
          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
            dark ? 'text-primary-foreground/65' : 'text-primary'
          }`}
        >
          {eyebrow}
        </p>
        <div className="space-y-3">
          <h3 className="max-w-md text-2xl font-bold leading-tight">{title}</h3>
          <p
            className={`max-w-lg text-sm leading-6 ${
              dark ? 'text-primary-foreground/78' : 'text-muted-foreground'
            }`}
          >
            {description}
          </p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex gap-3 text-sm leading-6">
              <IconCheck
                aria-hidden="true"
                className={`mt-1 h-4 w-4 shrink-0 ${
                  dark ? 'text-primary-foreground/70' : 'text-primary'
                }`}
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button
        asChild
        variant={dark ? 'secondary' : 'default'}
        className="mt-6 w-full sm:w-fit"
      >
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}
