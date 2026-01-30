/**
 * Badge beta pour l'auth (mobile)
 */

'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { FEATURES } from '@/lib/shared/config/features'

export function BetaMobileBadge() {
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

  if (!FEATURES.BETA_MODE) return null

  const displayCount = typeof betaCount === 'number' ? `${betaCount}` : '…'

  return (
    <Badge className="h-6 items-center rounded-full border border-amber-200 bg-amber-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
      Beta : {displayCount} utilisateurs / {FEATURES.MAX_BETA_USERS}
    </Badge>
  )
}
