/**
 * Banner d'alerte pour le statut KYC
 */

'use client'

import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { IconShield, IconClock, IconX } from '@tabler/icons-react'
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
        <IconClock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900">
          Vérification en cours
        </AlertTitle>
        <AlertDescription className="text-yellow-800">
          Nous examinons vos documents d'identité. Vous serez notifié par email
          dans les 24-48h.
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
  return (
    <Alert
      variant="default"
      className={`border-blue-500 bg-blue-50 ${className}`}
    >
      <IconShield className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900">
        Vérification d'identité requise pour continuer
      </AlertTitle>
      <AlertDescription className="text-blue-800">
        Pour publier un trajet, accepter un colis, effectuer un paiement,
        envoyer ou recevoir un colis ou activer une assurance, vous devez
        vérifier votre identité.{` `}
        <Button
          variant="link"
          asChild
          className="px-0 h-auto font-normal text-blue-600 underline"
        >
          <Link href="/dashboard/reglages/kyc">Vérifier mon identité →</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
