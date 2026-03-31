import { Badge } from '@/components/ui/badge'
import {
  IconPackage,
  IconStar,
  IconShieldCheck,
  IconLuggage,
} from '@tabler/icons-react'

const stats = [
  {
    icon: IconPackage,
    value: '275+',
    label: 'Colis livrés',
  },
  {
    icon: IconStar,
    value: '4.8/5',
    label: 'Satisfaction clients',
  },
  {
    icon: IconLuggage,
    value: 'France ⇄ Bénin',
    label: 'Service actif',
  },
  {
    icon: IconShieldCheck,
    value: '100%',
    label: 'Valises vérifiées',
  },
]

export function TrustStatsBlock() {
  return (
    <section className="py-12 sm:py-16 relative">
      <div className="container-wide space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
            >
              Sendbox en chiffres
            </Badge>
            <h3 className="font-display text-3xl sm:text-4xl font-bold">
              La confiance, c'est notre fondation
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Chaque envoi Sendbox est vérifié, suivi et garanti. Nos voyageurs
              sont sélectionnés et nos valises scellées avant le départ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border/60 bg-card/40 p-5 flex flex-col gap-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" stroke={1.5} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
