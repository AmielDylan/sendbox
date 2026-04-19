/**
 * Banner d'alerte pour le statut KYC
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { IconX } from '@tabler/icons-react'
import type { KYCStatus } from '@/types'

interface KYCAlertBannerProps {
  kycStatus: KYCStatus | null
  rejectionReason?: string | null
  className?: string
}

export function KYCAlertBanner({
  kycStatus,
  rejectionReason,
  className,
}: KYCAlertBannerProps) {
  const storageKey = useMemo(
    () =>
      `sendbox:kyc-banner:${kycStatus ?? 'missing'}:${rejectionReason ?? 'none'}`,
    [kycStatus, rejectionReason]
  )
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setDismissed(window.sessionStorage.getItem(storageKey) === '1')
  }, [storageKey])

  const handleDismiss = () => {
    setDismissed(true)

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(storageKey, '1')
    }
  }

  // Pas d'alerte si approuvé
  if (kycStatus === 'approved') {
    return null
  }

  // KYC en attente
  if (kycStatus === 'pending') {
    return (
      <Alert
        variant="default"
        className={`border-yellow-500 bg-yellow-50 ${className}`}
      >
        <AlertTitle className="text-xs font-medium text-yellow-900">
          Vérification en cours
        </AlertTitle>
        <AlertDescription className="text-xs text-yellow-800">
          Vos documents sont en cours d'examen. Vous serez notifié sous 24-48h.
        </AlertDescription>
      </Alert>
    )
  }

  // KYC refusé
  if (kycStatus === 'rejected') {
    return (
      <Alert variant="destructive" className={className}>
        <IconX className="h-4 w-4" />
        <AlertTitle>Vérification refusée</AlertTitle>
        <AlertDescription>
          {rejectionReason ||
            'Votre demande de vérification a été refusée. Veuillez soumettre de nouveaux documents.'}
          <Button
            variant="link"
            asChild
            className="px-0 h-auto font-normal text-destructive underline"
          >
            <Link href="/dashboard/reglages/kyc">Soumettre à nouveau →</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Pas de KYC ou incomplete
  if (dismissed) {
    return null
  }

  return (
    <Alert
      variant="default"
      className={`border-blue-400/70 bg-blue-50 pr-11 py-3 ${className ?? ''}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="absolute right-2 top-2 h-7 w-7 !pl-0 !pr-0 text-blue-700 hover:bg-blue-100 hover:text-blue-900"
        aria-label="Fermer l’alerte KYC"
      >
        <IconX className="h-4 w-4" />
      </Button>
      <AlertTitle className="text-sm font-semibold text-blue-900">
        Vérifiez votre identité pour continuer
      </AlertTitle>
      <AlertDescription className="text-xs leading-5 text-blue-800 sm:text-sm">
        Vérifiez votre identité pour publier, accepter un colis et utiliser les
        paiements.{` `}
        <Button
          variant="link"
          asChild
          className="h-auto px-0 text-xs font-medium text-blue-700 underline sm:text-sm"
        >
          <Link href="/dashboard/reglages/kyc">Vérifier mon identité →</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
