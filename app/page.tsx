import Link from 'next/link'
import {
  IconCamera,
  IconCheck,
  IconClipboardCheck,
  IconId,
  IconPackage,
  IconPlaneDeparture,
  IconRosetteDiscountCheck,
  IconShieldCheck,
  IconStar,
  IconUserCircle,
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
import { Separator } from '@/components/ui/separator'

const trustSignals = [
  { label: 'Identité vérifiée', icon: IconId },
  { label: 'Photos horodatées', icon: IconCamera },
  { label: 'Avis certifiés', icon: IconStar },
  { label: 'Profil public', icon: IconUserCircle },
]

const steps = [
  {
    title: 'Créer son profil vérifié',
    description: "KYC obligatoire à l'inscription",
    icon: IconShieldCheck,
  },
  {
    title: 'Trouver un voyageur ou annoncer son trip',
    description: 'Recherche par corridor et date',
    icon: IconPlaneDeparture,
  },
  {
    title: 'Confirmer la mise en relation',
    description: 'Les deux parties confirment',
    icon: IconClipboardCheck,
    badge: '1,50 € de frais de mise en relation',
  },
  {
    title: 'Remise + livraison avec photo',
    description: 'Horodatée par le serveur, confirmée par les deux',
    icon: IconCamera,
  },
  {
    title: 'Évaluation mutuelle',
    description: 'Avis simultanés et immuables',
    icon: IconRosetteDiscountCheck,
  },
]

const senderBenefits = [
  'Trouvez un voyageur sur votre corridor diaspora',
  'Confirmez la mise en relation pour 1,50 €',
  'Suivez la remise et la livraison avec preuves',
]

const travelerBenefits = [
  'Annoncez vos trajets et vos disponibilités',
  'Recevez des demandes alignées avec vos dates',
  'Inscription et utilisation gratuites',
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Sendbox
          </Link>

          <nav className="flex items-center gap-2" aria-label="Navigation">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Créer un compte</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              Corridors diaspora vérifiés
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Faites voyager vos colis avec des voyageurs{' '}
              <span className="text-primary">de confiance</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Une plateforme qui connecte la diaspora, avec des profils
              vérifiés, des livraisons tracées et des preuves partagées à chaque
              étape.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6">
              <Link href="/recherche">
                <IconPackage data-icon="inline-start" />
                J&apos;envoie un colis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6">
              <Link href="/dashboard/annonces/new">
                <IconPlaneDeparture data-icon="inline-start" />
                Je voyage
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {trustSignals.map(signal => {
              const Icon = signal.icon

              return (
                <div
                  key={signal.label}
                  className="flex items-center gap-3 rounded-md bg-background p-4"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium">{signal.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Separator />

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Comment ça marche
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Un parcours simple, vérifiable et conçu pour que chacun sache où il
            en est.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-lg border bg-background p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="font-semibold leading-snug">{step.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {step.badge ? (
                  <Badge variant="secondary" className="w-fit">
                    {step.badge}
                  </Badge>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Pour qui ?</h2>
            <p className="max-w-2xl text-muted-foreground">
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

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-20">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Prêt à commencer ?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Créez votre profil et rejoignez un réseau de voyageurs vérifiés.
          </p>
        </div>
        <Button asChild size="lg" className="h-12 px-7">
          <Link href="/register">Créer mon compte</Link>
        </Button>
      </section>
    </main>
  )
}

function AudienceCard({
  title,
  benefits,
  cta,
  href,
}: {
  title: string
  benefits: string[]
  cta: string
  href: string
}) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {benefits.map(benefit => (
            <li key={benefit} className="flex gap-3 text-sm leading-6">
              <IconCheck
                aria-hidden="true"
                className="mt-1 shrink-0 text-primary"
              />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
