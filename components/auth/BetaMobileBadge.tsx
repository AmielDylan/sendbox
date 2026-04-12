/**
 * Badge beta pour l'auth (mobile)
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { FEATURES } from '@/lib/shared/config/features'

export function BetaMobileBadge() {
  if (!FEATURES.BETA_MODE) return null

  return (
    <Badge className="h-6 items-center rounded-full border border-amber-200 bg-amber-100 px-2 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
      Accès bêta limité
    </Badge>
  )
}
