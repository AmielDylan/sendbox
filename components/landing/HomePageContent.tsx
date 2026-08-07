'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconCheck, IconMapPin } from '@tabler/icons-react'
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
    title: "Profils 100% vérifiés",
    description:
      "Identité contrôlée, avis de la communauté et score de confiance : vous savez exactement à qui vous confiez vos affaires.",
  },
  {
    title: "Preuves photo certifiées",
    description:
      "Des photos prises au départ et à la réception pour valider chaque étape de la livraison en toute clarté.",
  },
  {
    title: "Tarifs simples et directs",
    description:
      "Une mise en relation fluide. Vous définissez le prix du transport directement entre vous, sans intermédiaires.",
  },
]

const steps = [
  {
    title: "Créez votre profil vérifié",
    description:
      "Vérification d'identité rapide pour garantir la sécurité de l'ensemble de la communauté.",
  },
  {
    title: "Publiez ou recherchez",
    description:
      "Proposez vos kilos disponibles en soute ou trouvez un voyageur selon vos dates et votre destination.",
  },
  {
    title: "Validez votre accord",
    description:
      "Échangez sur les détails du colis et confirmez la mise en relation en toute sécurité.",
  },
  {
    title: "Remise et livraison avec photo",
    description:
      "Remettez le colis. Une photo prise au départ et à l'arrivée valide la bonne réception.",
  },
  {
    title: "Évaluez votre expérience",
    description:
      "Laissez un avis pour renforcer la confiance au sein du réseau Sendbox.",
  },
]

const faqs: { question: string; answer: string }[] = [
  {
    question: "Combien coûte Sendbox ?",
    answer:
      "Des frais de mise en relation de 2,90 EUR sont réglés par l'expéditeur après confirmation mutuelle. L'utilisation est gratuite pour les voyageurs. Le montant du transport se négocie directement entre les parties, hors plateforme.",
  },
  {
    question: "Comment sont vérifiés les profils ?",
    answer:
      "Chaque utilisateur passe par une vérification d'identité. Les profils non vérifiés ne peuvent pas publier d'annonces ni finaliser de mise en relation.",
  },
  {
    question: "Que se passe-t-il si mon colis est endommagé ou perdu ?",
    answer:
      "Sendbox est une plateforme de mise en relation et n'assure pas le transport. Des photos horodatées sont prises à la remise et à la livraison pour garder une trace utile en cas de désaccord.",
  },
  {
    question: "Comment fonctionne le paiement du transport ?",
    answer:
      "Le montant du transport se règle directement entre l'expéditeur et le voyageur, selon les modalités convenues ensemble. Sendbox facture uniquement les frais de mise en relation confirmée.",
  },
  {
    question: "Puis-je annuler une mise en relation ?",
    answer:
      "Avant la confirmation mutuelle des deux parties, la mise en relation peut être annulée sans frais. Une fois les deux parties confirmées, les frais de mise en relation sont prélevés et la mise en relation est effective.",
  },
  {
    question: "Dans quels pays Sendbox est-il disponible ?",
    answer:
      "Sendbox est actuellement actif sur la route France-Bénin. L'objectif est d'ouvrir progressivement d'autres destinations après les premiers retours de la communauté.",
  },
  {
    question: "Comment fonctionnent les avis ?",
    answer:
      "Les avis sont laissés par les deux parties après la livraison. Ils deviennent visibles ensemble et aident les prochains utilisateurs à se faire une idée plus juste.",
  },
  {
    question: "Mes données personnelles sont-elles protégées ?",
    answer:
      "Vos données sont hébergées en Europe. Les documents de vérification sont protégés et accessibles uniquement à l'équipe chargée des contrôles. Consultez notre politique de confidentialité pour les détails.",
  },
]

const senderBenefits: React.ReactNode[] = [
  "Trouvez un voyageur de confiance sur votre trajet",
  "Envoyez des cadeaux ou des produits à vos proches à prix réduit",
  "Suivez la remise et la livraison grâce aux preuves photo",
]

const travelerBenefits = [
  "Rentabilisez vos kilos disponibles en soute",
  "Recevez des demandes adaptées à vos dates et votre itinéraire",
  "Inscription rapide et gratuite",
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
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Faites voyager vos colis avec des personnes qui font le même trajet
            </h1>
            <div className="space-y-3">
              <p className="max-w-xl text-sm font-medium leading-6 text-white/90 sm:text-base sm:leading-7">
                La solution de covalisage simple, économique et sécurisée d'un bout à l'autre du monde.
              </p>
              <p className="max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
                Confiez vos paquets à des voyageurs vérifiés, de main à main. Profitez de tarifs avantageux, d'un suivi photo et d'une communauté certifiée.
              </p>
            </div>
            <LandingCta
              className="flex-wrap pt-2 sm:flex-nowrap"
              registerClassName="bg-white text-black transition-colors hover:bg-white/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              searchClassName="border-white/70 bg-transparent text-white transition-colors hover:border-white hover:bg-white/10 hover:text-white dark:text-white dark:hover:text-white"
            />
          </div>
        </div>
      </section>

      {/* Pays couverts */}
      <section className="relative overflow-hidden border-b bg-background py-16 sm:py-24">
        <div className="container-wide">
          <div className="mb-10 space-y-3 text-center">
            <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Sendbox couvre actuellement la France et le Bénin
            </h3>
            <p className="text-sm text-muted-foreground">
              D'autres destinations arrivent bientôt.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl">
            <Image
              src="/images/landing/world-map.png"
              alt="Carte des destinations Sendbox - France et Bénin"
              width={1200}
              height={680}
              className="w-full object-cover"
            />
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/55">
            <IconMapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pays en préparation</span>
          </div>
        </div>
      </section>

      {/* Pourquoi Sendbox */}
      <section className="relative py-20 sm:py-28 bg-background border-b">
        <div className="container-wide space-y-12">
          <div className="max-w-2xl space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Pourquoi choisir Sendbox ?
            </h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Un cadre clair, sûr et humain pour voyager et faire circuler vos colis en toute sérénité.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-6 transition-colors hover:border-primary/25 hover:bg-primary/[0.03] animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ca marche */}
      <section className="py-24 sm:py-32">
        <div className="container-wide space-y-12">
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 text-muted-foreground">
              Un parcours simple et vérifiable pour envoyer vos colis d'une ville à une autre.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col gap-5 rounded-xl border border-border/70 bg-background p-6 transition-colors hover:border-primary/20 hover:shadow-[0_2px_12px_-2px_hsl(var(--primary)/0.08)] animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
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
            ))}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Le prix du transport par kilo est convenu entre l'expéditeur et le voyageur avant la confirmation, puis réglé directement de main à main.
          </p>
        </div>
      </section>

      {/* Pour qui */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="container-wide">
          <div className="space-y-10">
            <div className="max-w-2xl space-y-4 animate-fade-in-up">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Pour qui est fait Sendbox ?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                Sendbox accompagne tous ceux qui recherchent une solution d'envoi humaine, rapide et sécurisée.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <AudienceSection
                eyebrow="Expéditeurs"
                title="Vous souhaitez envoyer un colis ?"
                benefits={senderBenefits}
                cta="Chercher un voyageur"
                href="/recherche"
              />
              <AudienceSection
                eyebrow="Voyageurs"
                title="Vous voyagez prochainement ?"
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
                Rejoignez une communauté internationale de voyageurs vérifiés.
              </h2>
              <p className="text-sm leading-6 text-white/68 sm:text-base sm:leading-7">
                Créez votre profil en quelques minutes et organisez vos envois en toute confiance.
              </p>
            </div>
            <div className="relative flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button
                asChild
                size="default"
                className="bg-white text-black transition-colors hover:bg-white/90"
              >
                <Link href="/register">Créer mon compte</Link>
              </Button>
              <Button
                asChild
                size="default"
                variant="outline"
                className="border-white/25 bg-transparent text-white transition-colors hover:bg-white/8 hover:border-white/40 hover:text-white"
              >
                <Link href="/recherche">Explorer les trajets</Link>
              </Button>
            </div>
            <p className="relative text-xs text-white/40 lg:col-start-2 lg:text-right">
              Sendbox. La plateforme de covalisage qui connecte les voyageurs et les expéditeurs.
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
  benefits,
  cta,
  href,
  dark = false,
}: {
  eyebrow: string
  title: string
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
        <h3 className="max-w-md text-2xl font-bold leading-tight">{title}</h3>
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
