'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  IconCamera,
  IconCheck,
  IconUserCheck,
  IconHandshake,
  IconMapPin,
  IconCoins,
  IconStar,
  IconSearch,
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
    title: 'Profils 100% vérifiés',
    description:
      "Identité contrôlée, avis de la communauté et score de confiance : vous savez exactement à qui vous confiez vos affaires.",
    icon: IconUserCheck,
  },
  {
    title: 'Preuves photo certifiées',
    description:
      "Des photos prises au départ et à la réception pour valider chaque étape de la livraison en toute clarté.",
    icon: IconCamera,
  },
  {
    title: 'Tarifs simples et directs',
    description:
      "Une mise en relation fluide. Vous définissez le prix du transport directement entre vous, sans intermédiaires.",
    icon: IconCoins,
  },
]

const steps = [
  {
    title: 'Créez votre profil',
    description:
      "Vérifiez votre identité une fois pour toutes. Vous accédez ensuite à toutes les annonces de la plateforme.",
    icon: IconUserCheck,
  },
  {
    title: 'Trouvez ou publiez une annonce',
    description:
      "Expéditeur, cherchez un voyageur sur votre route. Voyageur, publiez vos dates et votre disponibilité.",
    icon: IconSearch,
  },
  {
    title: "Confirmez l'accord ensemble",
    icon: IconHandshake,
    description:
      "Les deux parties valident le contenu et les modalités. Les frais Sendbox sont réglés à ce moment.",
  },
  {
    title: 'Remise du colis avec photos',
    icon: IconCamera,
    description:
      "Des photos horodatées au départ et à l'arrivée. Chacun dispose d'une preuve consultable à tout moment.",
  },
  {
    title: 'Évaluez votre expérience',
    icon: IconStar,
    description:
      "Un avis de chaque côté après la livraison. La réputation se bâtit sur le vécu, pas sur des promesses.",
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
  "Identité du voyageur vérifiée avant tout contact",
  "Contenu du colis déclaré et validé avant accord",
  "Photos certifiées au départ et à la réception",
]

const travelerBenefits = [
  "Vous choisissez vos dates et votre capacité",
  "Demandes détaillées à consulter avant d'accepter",
  "Gratuit pour les voyageurs, aucune surprise",
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

        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 pt-16 sm:px-8 sm:py-24 lg:px-24 lg:py-28 xl:px-[6.25rem]">
          <div className="max-w-xl space-y-6 text-left animate-fade-in-up">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-sm">
              Disponible aujourd'hui entre la France et le Bénin
            </span>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Faites voyager vos colis avec des personnes qui font le même trajet.
            </h1>

            <p className="max-w-xl text-sm leading-6 text-white/82 sm:text-base sm:leading-7">
              Des profils vérifiés, un accord clair et des preuves photo à chaque étape, de la remise à la livraison.
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
      <section className="relative overflow-hidden border-b bg-background py-16 sm:py-24">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-10 space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Disponible maintenant
            </p>
            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Sendbox couvre actuellement la France et le Bénin
            </h3>
            <p className="text-sm text-muted-foreground">
              D'autres destinations arrivent bientôt.
            </p>
          </div>

          {/* Carte mondiale */}
          <div className="relative mx-auto w-full max-w-4xl select-none">
            <svg
              viewBox="0 0 1000 500"
              aria-hidden="true"
              className="w-full text-foreground"
            >
              <defs>
                <pattern id="wdots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="7" cy="7" r="1.8" fill="currentColor" opacity="0.14" />
                </pattern>
                {/* Continent shapes (simplified ellipses for clip) */}
                <clipPath id="lands">
                  <ellipse cx="165" cy="158" rx="126" ry="108" /> {/* Amérique du Nord */}
                  <ellipse cx="338" cy="52" rx="54" ry="37" />    {/* Groenland */}
                  <ellipse cx="234" cy="348" rx="72" ry="96" />   {/* Amérique du Sud */}
                  <ellipse cx="492" cy="112" rx="56" ry="64" />   {/* Europe */}
                  <ellipse cx="500" cy="305" rx="78" ry="130" />  {/* Afrique */}
                  <ellipse cx="744" cy="152" rx="214" ry="118" /> {/* Asie */}
                  <ellipse cx="712" cy="228" rx="36" ry="46" />   {/* Sous-continent indien */}
                  <ellipse cx="878" cy="150" rx="14" ry="30" />   {/* Japon */}
                  <ellipse cx="843" cy="362" rx="70" ry="47" />   {/* Australie */}
                </clipPath>
                {/* Fade edges */}
                <radialGradient id="mfade" cx="50%" cy="50%" r="55%">
                  <stop offset="25%" stopColor="white" stopOpacity="0" />
                  <stop offset="100%" stopColor="white" stopOpacity="1" />
                </radialGradient>
                <mask id="mmask">
                  <rect width="1000" height="500" fill="white" />
                  <rect width="1000" height="500" fill="url(#mfade)" />
                </mask>
              </defs>

              {/* Dot continents */}
              <rect width="1000" height="500" fill="url(#wdots)" clipPath="url(#lands)" mask="url(#mmask)" />

              {/* Route France -> Bénin */}
              <line
                x1="506" y1="132"
                x2="506" y2="218"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity="0.4"
              />

              {/* Future destination pins */}
              {([[280, 150], [222, 118], [302, 328], [720, 212], [820, 222], [462, 238]] as [number, number][]).map(([cx, cy], i) => (
                <circle
                  key={i}
                  cx={cx} cy={cy} r="6.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  opacity="0.22"
                />
              ))}
            </svg>

            {/* France — pin HTML overlay */}
            <div
              aria-label="France"
              className="pointer-events-none absolute flex flex-col items-center"
              style={{ left: '50.6%', top: '22.8%', transform: 'translate(-50%, -100%)' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[22px] shadow-md ring-1 ring-black/10 dark:ring-white/15 sm:h-12 sm:w-12 sm:text-2xl">
                🇫🇷
              </div>
              <div className="h-0 w-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '9px solid white' }} />
            </div>
            <span className="pointer-events-none absolute whitespace-nowrap text-center text-xs font-semibold text-foreground" style={{ left: '50.6%', top: '22.8%', transform: 'translate(-50%, 4px)' }}>
              France
            </span>

            {/* Bénin — pin HTML overlay */}
            <div
              aria-label="Bénin"
              className="pointer-events-none absolute flex flex-col items-center"
              style={{ left: '50.6%', top: '45.6%', transform: 'translate(-50%, -100%)' }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[22px] shadow-md ring-1 ring-black/10 dark:ring-white/15 sm:h-12 sm:w-12 sm:text-2xl">
                🇧🇯
              </div>
              <div className="h-0 w-0" style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '9px solid white' }} />
            </div>
            <span className="pointer-events-none absolute whitespace-nowrap text-center text-xs font-semibold text-foreground" style={{ left: '50.6%', top: '45.6%', transform: 'translate(-50%, 4px)' }}>
              Bénin
            </span>
          </div>

          {/* Légende */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/55">
            <IconMapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pays en préparation</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 sm:py-28 bg-background border-b">
        <div className="container-wide space-y-12">
          <div className="max-w-2xl space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pourquoi choisir Sendbox?
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Chaque mise en relation repose sur des informations concrètes, pas sur la confiance aveugle.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-muted/20 p-6 transition-colors hover:border-primary/25 hover:bg-primary/[0.03] animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="space-y-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-base">{feature.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  {/* Placeholder illustration - replace with asset */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/5"
                  >
                    <Icon className="h-7 w-7 text-primary/20" />
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
              Comment ça marche?
            </h2>
            <p className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 text-muted-foreground">
              Cinq étapes, pas une de plus. Vous gardez la main à chaque moment.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div
                  key={step.title}
                  className="relative flex min-h-[14rem] flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-background p-6 transition-colors hover:border-primary/20 hover:shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.08)] animate-fade-in-up"
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
                  {/* Placeholder illustration - replace with asset */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5"
                  >
                    <StepIcon className="h-8 w-8 text-primary/20" />
                  </div>
                </div>
              )
            })}
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
                Pour qui est fait Sendbox?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Deux rôles, une même exigence : savoir exactement à qui on a affaire.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AudienceSection
                eyebrow="Vous envoyez un colis"
                title="Confiez vos affaires à quelqu'un de concret, pas à une boîte noire."
                description="Trouvez un voyageur vérifié sur votre route, déclarez votre contenu en amont et convenez du tarif directement avec lui."
                benefits={senderBenefits}
                cta="Trouver un voyageur"
                href="/recherche"
              />
              <AudienceSection
                eyebrow="Vous voyagez"
                title="Rentabilisez votre trajet avec des demandes que vous choisissez."
                description="Publiez vos disponibilités, consultez ce qu'on vous demande d'emporter et acceptez uniquement ce qui vous convient."
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
              className="object-cover opacity-[0.18]"
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
