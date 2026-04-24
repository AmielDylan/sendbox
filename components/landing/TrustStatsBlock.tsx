import { Badge } from '@/components/ui/badge'
import {
  IconCircleCheck,
  IconQrcode,
  IconClock,
  IconCurrencyEuro,
} from '@tabler/icons-react'

const stats = [
  {
    icon: IconCircleCheck,
    value: '100%',
    label: 'Voyageurs vérifiés',
  },
  {
    icon: IconQrcode,
    value: 'QR Code',
    label: 'Suivi en temps réel',
  },
  {
    icon: IconClock,
    value: 'Sous 48h',
    label: 'Délai moyen garanti',
  },
  {
    icon: IconCurrencyEuro,
    value: '0 surprise',
    label: 'Tarif fixe, aucune négociation',
  },
]

export function TrustStatsBlock() {
  return (
    <section className="border-y border-border/60 bg-background/80 py-12 sm:py-14">
      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-3">
            <Badge
              variant="outline"
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em]"
            >
              Confiance visible
            </Badge>
            <h3 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Les signaux qui rassurent avant même de réserver.
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Chaque publication est lue à travers des preuves simples:
              vérification, suivi, cadre tarifaire et vitesse de traitement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="space-y-3 border-t border-border/70 pt-4"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" stroke={1.5} />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
