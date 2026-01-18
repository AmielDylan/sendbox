/**
 * Layout pour les routes d'authentification
 * (login, register, etc.)
 */

import { Badge } from '@/components/ui/badge'
import { PublicFooter } from '@/components/layouts/PublicFooter'
import { PublicHeader } from '@/components/layouts/PublicHeader'
import { IconShieldCheck, IconSparkles, IconClock } from '@tabler/icons-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background"
            aria-hidden="true"
          />
          <div className="container-wide relative py-10 sm:py-14 lg:py-20">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
              <div className="flex justify-center lg:justify-start">
                {children}
              </div>
              <aside className="hidden lg:flex flex-col gap-6 border-l border-border/50 pl-6 pr-4 py-4 bg-muted/20 w-full">
                <Badge variant="outline" className="w-fit gap-2 rounded px-3 py-1 text-xs">
                  <IconSparkles className="h-3.5 w-3.5 text-primary" />
                  Accès sécurisé
                </Badge>
                <div className="space-y-3">
                  <h1 className="font-display text-2xl text-balance">
                    Votre espace Sendbox
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connectez-vous pour gérer vos réservations, suivre vos colis et échanger avec les voyageurs.
                  </p>
                </div>
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <IconShieldCheck className="h-4 w-4 text-primary" />
                    Paiements sécurisés et vérifiés
                  </div>
                  <div className="flex items-center gap-2">
                    <IconClock className="h-4 w-4 text-primary" />
                    Suivi clair des étapes de livraison
                  </div>
                  <div className="flex items-center gap-2">
                    <IconSparkles className="h-4 w-4 text-primary" />
                    Support actif et profils de confiance
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ils nous font confiance
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="border border-border/60 bg-background/80 px-4 py-3">
                      <p className="text-sm italic text-foreground">
                        "Réservation rapide, suivi clair et échange facile."
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Aïcha · Expéditrice
                      </p>
                    </div>
                    <div className="border border-border/60 bg-background/80 px-4 py-3">
                      <p className="text-sm italic text-foreground">
                        "Interface simple et profils rassurants."
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Marc · Voyageur
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Vos informations restent privées et protégées à chaque étape.
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
