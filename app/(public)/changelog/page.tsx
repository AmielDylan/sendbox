import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Changelog — Sendbox',
  description:
    'Historique des mises à jour et nouvelles fonctionnalités de Sendbox.',
}

type ChangelogEntry = {
  version: string
  date: string
  label: string
  highlights: string[]
  type: 'major' | 'minor' | 'patch'
}

const entries: ChangelogEntry[] = [
  {
    version: '1.4',
    date: 'Mai 2026',
    label: 'Trust system',
    type: 'major',
    highlights: [
      "Notes en aveugle — les avis ne sont révélés qu'une fois les deux parties ayant soumis le leur, éliminant toute influence mutuelle.",
      "Lifecycle horodaté des mises en relation : chaque transition d'état (confirmation, remise, livraison, évaluation) porte un timestamp serveur immuable.",
      "Mécanisme anti-collusion : impossibilité de consulter l'avis adverse avant de soumettre le sien.",
      'Score de confiance public recalculé à chaque évaluation et visible sur tous les profils.',
    ],
  },
  {
    version: '1.3',
    date: 'Avril 2026',
    label: 'Localisation contrainte',
    type: 'minor',
    highlights: [
      'Remplacement des champs texte libres (ville de départ / arrivée) par des sélecteurs contraints basés sur la base LOCATIONS.',
      "Sélecteur de pays avec drapeau, suivi d'un sélecteur de ville filtré dynamiquement par pays.",
      'Cohérence garantie des données pour la recherche par corridor — fin des variantes orthographiques.',
      'Couverture initiale : France (Paris, Lyon, Bordeaux, Marseille…) ↔ Bénin (Cotonou, Porto-Novo, Parakou…).',
    ],
  },
  {
    version: '1.2',
    date: 'Mars 2026',
    label: 'KYC automatisé',
    type: 'minor',
    highlights: [
      "Lecture automatique de la zone MRZ (Machine Readable Zone) des pièces d'identité soumises.",
      'Score de confiance OCR : si la confiance est insuffisante, le dossier bascule en vérification manuelle admin.',
      "Dashboard admin dédié à la revue KYC : visualisation des documents, résultats MRZ, actions d'approbation ou de rejet.",
      "Notifications en temps réel à l'utilisateur à chaque changement de statut de son dossier.",
    ],
  },
  {
    version: '1.1',
    date: 'Février 2026',
    label: 'Messagerie & preuves',
    type: 'minor',
    highlights: [
      'Messagerie temps réel entre expéditeur et voyageur via Supabase Realtime.',
      'Photos horodatées côté serveur à la remise du colis et à la livraison.',
      "Confirmation mutuelle par QR code : chaque partie scanne le code de l'autre pour valider l'étape.",
      'Conservation des preuves photos pendant 12 mois dans le système de stockage chiffré.',
    ],
  },
  {
    version: '1.0',
    date: 'Janvier 2026',
    label: 'Lancement beta',
    type: 'major',
    highlights: [
      "Publication d'annonces de trajets : corridor, dates, capacité disponible, prix indicatif.",
      "Profils utilisateurs avec vérification d'identité manuelle (KYC v1).",
      'Système de mise en relation : recherche de voyageurs par corridor et date, demande et acceptation.',
      'Frais de mise en relation de 1,50 € TTC prélevés à la confirmation mutuelle.',
      'Lancement du corridor France — Bénin.',
    ],
  },
]

const typeConfig: Record<
  ChangelogEntry['type'],
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  major: { label: 'Majeur', variant: 'default' },
  minor: { label: 'Fonctionnalité', variant: 'secondary' },
  patch: { label: 'Correctif', variant: 'outline' },
}

export default function ChangelogPage() {
  return (
    <main className="container-wide py-16 sm:py-24">
      <header className="mb-16 space-y-4">
        <Badge
          variant="outline"
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
        >
          Historique
        </Badge>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Changelog
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          Toutes les mises à jour de la plateforme, dans l&apos;ordre
          chronologique inverse.
        </p>
      </header>

      <div className="relative">
        {/* Trait vertical de la timeline */}
        <div className="absolute left-[7px] top-2 hidden h-full w-px bg-gradient-to-b from-primary/40 via-border to-transparent sm:block" />

        <ol className="space-y-14">
          {entries.map((entry, index) => {
            const config = typeConfig[entry.type]
            return (
              <li key={entry.version} className="relative sm:pl-10">
                {/* Dot */}
                <span className="absolute left-0 top-1.5 hidden h-3.5 w-3.5 rounded-full border-2 border-primary bg-background sm:block" />

                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg font-bold sm:text-xl">
                      v{entry.version}
                    </span>
                    <Badge variant={config.variant} className="text-xs">
                      {config.label}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {entry.label}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {entry.date}
                    </span>
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-3">
                    {entry.highlights.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm leading-6 text-muted-foreground sm:text-[15px] sm:leading-7"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {index < entries.length - 1 && (
                    <Separator className="sm:hidden" />
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </main>
  )
}
