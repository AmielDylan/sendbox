/**
 * Sidebar intelligente pour les pages d'authentification
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  IconShieldCheck,
  IconClock,
  IconUsers,
  IconCheck,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { FEATURES } from '@/lib/shared/config/features'

export function AuthSidebar() {
  const pathname = usePathname()
  const isRegister = pathname?.includes('register')
  const [betaCount, setBetaCount] = useState<number | null>(null)

  useEffect(() => {
    if (!FEATURES.BETA_MODE) return

    let isMounted = true
    const loadCount = async () => {
      try {
        const res = await fetch('/api/beta-stats')
        if (!res.ok) return
        const payload = await res.json()
        if (isMounted && typeof payload?.count === 'number') {
          setBetaCount(payload.count)
        }
      } catch {
        // ignore
      }
    }

    void loadCount()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="w-full max-w-md space-y-6">
      <BetaInfoBadge count={betaCount} />
      {isRegister ? (
        <>
          {/* Registration Progress */}
          <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Créez votre compte en 2 min
            </h3>
            <div className="space-y-3">
              {[
                'Informations personnelles',
                'Email et mot de passe',
                'Accepter les conditions',
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What You Get */}
          <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Ce que vous obtenez
            </h3>
            <div className="space-y-3">
              {[
                { icon: IconShieldCheck, text: 'Profil vérifié et sécurisé' },
                { icon: IconClock, text: 'Suivi en temps réel' },
                { icon: IconUsers, text: 'Accès à la communauté' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Login Benefits */}
          <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Votre espace Sendbox
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Accédez à votre tableau de bord pour gérer vos annonces, suivre
              vos colis et communiquer en toute sécurité.
            </p>
          </div>

          {/* Security Info */}
          <div className="rounded-2xl border-2 border-border/50 bg-background/95 backdrop-blur-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Sécurité renforcée
            </h3>
            <div className="space-y-3">
              {[
                'Chiffrement de bout en bout',
                'Authentification sécurisée',
                'Vérification KYC disponible',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <IconCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Trust Indicator */}
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 backdrop-blur-sm p-4">
        <p className="text-sm text-foreground text-center">
          <span className="font-semibold">100% sécurisé</span>
          <br />
          <span className="text-muted-foreground text-xs">
            Vos données sont protégées
          </span>
        </p>
      </div>
    </div>
  )
}

function BetaInfoBadge({ count }: { count: number | null }) {
  if (!FEATURES.BETA_MODE) return null

  const displayCount = typeof count === 'number' ? `${count}` : '…'

  return (
    <Badge className="h-6 items-center rounded-full border border-amber-200 bg-amber-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
      Beta : {displayCount} utilisateurs / {FEATURES.MAX_BETA_USERS}
    </Badge>
  )
}
