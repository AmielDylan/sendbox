'use client'

import { IconAlertTriangle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FEATURES } from '@/lib/shared/config/features'

export function BetaBanner() {
  if (!FEATURES.BETA_MODE) return null

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
      <IconAlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Version Beta</AlertTitle>
      <AlertDescription className="text-amber-700">
        Plateforme en test ({FEATURES.MAX_BETA_USERS} utilisateurs max).
        Montants limités à {FEATURES.MAX_BOOKING_AMOUNT}€/réservation.
      </AlertDescription>
    </Alert>
  )
}
