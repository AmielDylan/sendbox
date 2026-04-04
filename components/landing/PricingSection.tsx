import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconCheck, IconSparkles } from '@tabler/icons-react'

const perks = [
  'Profil professionnel vérifié',
  'Publication de trajets illimitée',
  'Tableau de bord revenus & envois',
  'Badge de confiance visible des expéditeurs',
  'Support prioritaire',
]

export function PricingSection() {
  return (
    <section className="py-20 sm:py-28 bg-muted/30 relative">
      <div className="container-wide">
        <div className="text-center space-y-4 mb-12 animate-fade-in-up">
          <Badge
            variant="outline"
            className="text-xs uppercase tracking-widest font-semibold px-4 py-2"
          >
            Accès voyageur pro
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold">
            Un seul tarif, tout inclus.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Pour les voyageurs qui font du covalisage sérieusement.
          </p>
        </div>

        <Card className="max-w-md mx-auto border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 animate-fade-in-up">
          <div className="p-8 space-y-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <IconSparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-bold">4,99 €</p>
                <p className="text-sm text-muted-foreground">/ mois</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Publiez autant de trajets que vous voulez.
            </p>

            <ul className="space-y-3">
              {perks.map(perk => (
                <li key={perk} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <IconCheck className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{perk}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              + 3 % de frais plateforme par transaction (escrow + garantie paiement)
            </p>

            <Button asChild size="lg" className="w-full">
              <Link href="/register">Commencer — 4,99 €/mois</Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Inscrivez-vous gratuitement. Abonnement activé à la première
              publication.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
