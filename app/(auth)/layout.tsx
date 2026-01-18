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
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-center">
              <aside className="hidden lg:flex flex-col gap-6 rounded-md border border-border/70 bg-muted/30 p-8">
                <Badge variant="outline" className="w-fit gap-2 rounded px-3 py-1 text-xs">
                  <IconSparkles className="h-3.5 w-3.5 text-primary" />
                  Accès sécurisé
                </Badge>
                <div className="space-y-3">
                  <h1 className="font-display text-3xl text-balance">
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
                <div className="rounded-md border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Vos informations restent privées et protégées à chaque étape.
                </div>
              </aside>

              <div className="flex justify-center lg:justify-end">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
