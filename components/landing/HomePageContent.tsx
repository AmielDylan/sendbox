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
      'Vous savez avec qui vous échangez avant d’aller plus loin. Aucun profil anonyme.',
    icon: IconUserCheck,
  },
  {
    title: 'Colis déclaré avant accord',
    description:
      'Le voyageur consulte le contenu annoncé et décide librement avant d’accepter.',
    icon: IconCircleCheck,
  },
  {
    title: 'Photos à la remise et à la livraison',
    description:
      'Des preuves horodatées accompagnent chaque étape, consultables par les deux parties.',
    icon: IconCamera,
  },
  {
    title: 'Avis partagés après l’envoi',
    description:
      'La réputation se construit sur les expériences réelles, pas sur des déclarations.',
    icon: IconCheck,
  },
]

const steps = [
  {
    title: 'Profil et identité',
    description:
      'Vérifiez votre identité une fois pour toutes. Puis parcourez les trajets disponibles ou publiez vos propres dates.',
  },
  {
    title: 'Déclaration du colis',
    description:
      "L'expéditeur décrit le contenu en détail. Le voyageur consulte et décide librement, sans pression.",
  },
  {
    title: 'Accord mutuel',
    description:
      'Les deux parties confirment ensemble. Les frais Sendbox (2,90 €) sont prélevés à ce moment.',
  },
  {
    title: 'Remise et traçabilité',
    description:
      "Photos horodatées à la remise et à la livraison. Un avis de part et d'autre vient clôre l'envoi.",
  },
]

const faqs: { question: string; answer: string }[] = [
  {
    question: 'Combien coûte Sendbox ?',
    answer:
      "Des frais de mise en relation de 2,90 € sont réglés par l'expéditeur après confirmation mutuelle. L'utilisation est gratuite pour les voyageurs. Le montant du transport se négocie directement entre les parties, hors plateforme.",
  },
  {
    question: 'Comment sont vérifiés les profils ?',
    answer:
      "Chaque utilisateur passe par une vérification d'identité. Les profils non vérifiés ne peuvent pas publier d'annonces ni finaliser de mise en relation.",
  },
  {
    question: 'Que se passe-t-il si mon colis est endommagé ou perdu ?',
    answer:
      "Sendbox est une plateforme de mise en relation et n'assure pas le transport. Des photos horodatées sont prises à la remise et à la livraison pour garder une trace utile en cas de désaccord.",
  },
  {
    question: 'Comment fonctionne le paiement du transport ?',
    answer:
      "Le montant du transport se règle directement entre l'expéditeur et le voyageur, selon les modalités convenues ensemble. Sendbox facture uniquement les frais de mise en relation confirmée.",
  },
  {
    question: 'Puis-je annuler une mise en relation ?',
    answer:
      'Avant la confirmation mutuelle des deux parties, la mise en relation peut être annulée sans frais. Une fois les deux parties confirmées, les frais de mise en relation sont prélevés et la mise en relation est effective.',
  },
  {
    question: 'Dans quels pays Sendbox est-il disponible ?',
    answer:
      "Sendbox est actuellement actif sur la route France-Bénin. L'objectif est d'ouvrir progressivement d'autres destinations après les premiers retours de la communauté.",
  },
  {
    question: 'Comment fonctionnent les avis ?',
    answer:
      'Les avis sont laissés par les deux parties après la livraison. Ils deviennent visibles ensemble et aident les prochains utilisateurs à se faire une idée plus juste.',
  },
  {
    question: 'Mes données personnelles sont-elles protégées ?',
    answer:
      "Vos données sont hébergées en Europe. Les documents de vérification sont protégés et accessibles uniquement à l'équipe chargée des contrôles. Consultez notre politique de confidentialité pour les détails.",
  },
]

const senderBenefits: React.ReactNode[] = [
  'Profil et trajet du voyageur visibles avant tout échange',
  'Contenu du colis déclaré avant accord',
  'Preuves à la remise et à la livraison',
]

const travelerBenefits = [
  'Vous contrôlez vos dates et votre capacité',
  'Demandes détaillées avant tout engagement',
  'Gratuit pour les voyageurs, sans surprise',
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
              Transformez chaque voyage en solution d'envoi sécurisée.
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

      {/* Routes actives */}
      <section className="relative overflow-hidden border-b bg-muted/40 py-14 sm:py-20">
        {/* Dotted map background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, hsl(var(--foreground) / 0.10) 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container-wide relative z-10">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Disponible maintenant
              </p>
              <h3 className="text-xl font-bold sm:text-2xl">
                Votre colis voyage avec quelqu'un qui y va.
              </h3>
            </div>

            {/* Route map visual */}
            <div className="flex w-full max-w-sm items-center gap-6">
              {/* France */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-lg ring-2 ring-primary/20 dark:bg-neutral-900 dark:ring-primary/30">
                  🇫🇷
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-white dark:ring-neutral-900" />
                </div>
                <span className="text-sm font-semibold">France</span>
              </div>

              {/* Route line */}
              <div className="flex flex-1 flex-col items-center gap-2">
                <svg viewBox="0 0 120 8" className="w-full" fill="none" aria-hidden="true">
                  <path
                    d="M 4 4 L 116 4"
                    stroke="hsl(var(--primary) / 0.35)"
                    strokeWidth="1.5"
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                  />
                  <circle cx="4" cy="4" r="2.5" fill="hsl(var(--primary))" opacity="0.45" />
                  <circle cx="116" cy="4" r="2.5" fill="hsl(var(--primary))" opacity="0.45" />
                </svg>
                <span className="rounded-full bg-primary/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Europe - Afrique
                </span>
              </div>

              {/* Bénin */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-lg ring-2 ring-primary/20 dark:bg-neutral-900 dark:ring-primary/30">
                  🇧🇯
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary ring-2 ring-white dark:ring-neutral-900" />
                </div>
                <span className="text-sm font-semibold">Bénin</span>
              </div>
            </div>

            <p className="max-w-xs text-sm text-muted-foreground">
              D'autres destinations ouvriront progressivement.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-28 bg-background border-b">
        <div className="container-wide space-y-12">
          <div className="max-w-2xl space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Ce qui rend l'échange plus sûr.
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Avant d'accepter, chacun voit l'essentiel : le profil, le contenu
              déclaré et les informations du trajet.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex flex-col gap-5 rounded-xl border border-border/70 bg-muted/20 p-6 transition-colors hover:border-primary/25 hover:bg-primary/[0.03] animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-base">{feature.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="py-24 sm:py-32">
        <div className="container-wide space-y-12">
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Un envoi clair, étape par étape.
            </h2>
            <p className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 text-muted-foreground">
              Vous gardez la main à chaque étape. Sendbox cadre la mise en
              relation et conserve les preuves utiles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex min-h-[14rem] flex-col justify-between rounded-xl border border-border/70 bg-background p-6 transition-colors hover:border-primary/20 hover:shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.08)] animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="space-y-5">
                  <span className="font-display text-5xl font-bold leading-none text-primary/18 select-none">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Le transport est convenu et réglé directement entre l'expéditeur et
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
                Une plateforme, deux rôles.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Expéditeur ou voyageur, le cadre est le même : chacun dispose
                des informations utiles avant de confirmer.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AudienceSection
                eyebrow="Pour les expéditeurs"
                title="Envoyer sans confier son colis au hasard."
                description="Parcourez les trajets vérifiés, déclarez votre contenu en amont et convenez du transport directement avec le voyageur."
                benefits={senderBenefits}
                cta="Trouver un voyageur"
                href="/recherche"
              />
              <AudienceSection
                eyebrow="Pour les voyageurs"
                title="Voyager avec une demande claire dès le départ."
                description="Publiez vos disponibilités, consultez ce qu'on vous demande d'emporter et acceptez seulement ce qui vous convient."
                benefits={travelerBenefits}
                cta="Publier un trajet"
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
          <div className="relative grid gap-8 overflow-hidden rounded-2xl bg-neutral-950 p-8 text-white animate-fade-in-up sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <Image
              src="/images/landing/cta-bg.jpg"
              alt=""
              fill
              className="object-cover opacity-25 mix-blend-luminosity"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/85 via-neutral-950/60 to-neutral-950/40" />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-primary/8 blur-2xl"
            />

            <div className="relative max-w-2xl space-y-3">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Prêt à organiser un premier envoi ?
              </h2>
              <p className="text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
                Créez votre profil, vérifiez votre identité et envoyez sur la
                route France-Bénin.
              </p>
            </div>

            <div className="relative flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button
                asChild
                size="default"
                className="bg-white text-black transition-colors hover:bg-white/90"
              >
                <Link href="/register">Envoyer un colis</Link>
              </Button>
              <Button
                asChild
                size="default"
                variant="outline"
                className="border-white/25 bg-transparent text-white transition-colors hover:bg-white/8 hover:border-white/40 hover:text-white"
              >
                <Link href="/dashboard/annonces/new">Publier un trajet</Link>
              </Button>
            </div>
            <p className="relative text-xs text-white/40 lg:col-start-2 lg:text-right">
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
      className={`flex min-h-[20rem] flex-col justify-between rounded-xl border p-6 animate-fade-in-up sm:p-7 ${
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
