/**
 * Page de configuration des paiements (Stripe Connect)
 */

'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { ConnectOnboardingForm } from '@/components/features/payments/ConnectOnboardingForm'
import { ConnectStatusDisplay } from '@/components/features/payments/ConnectStatusDisplay'
import { Button } from '@/components/ui/button'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null

export default function PaymentsSettingsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [showForm, setShowForm] = useState(false)

  const kycStatus = (profile?.kyc_status ?? null) as KYCStatus
  const canConfigurePayments = kycStatus === 'approved'

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ajouter un compte bancaire"
          description="Configurez vos paiements pour recevoir vos gains."
        />
        <Alert>
          <AlertTitle>Réservé aux utilisateurs</AlertTitle>
          <AlertDescription>
            Les paramètres de paiement ne sont pas disponibles pour les comptes
            administrateurs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!canConfigurePayments) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ajouter un compte bancaire"
          description="Recevez vos paiements directement sur votre compte."
        />
        <Alert>
          <AlertTitle>Vérification d'identité requise</AlertTitle>
          <AlertDescription>
            Vous devez d'abord vérifier votre identité avant de pouvoir activer
            les paiements. Cela nous aide à prévenir la fraude et à protéger
            votre compte.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/dashboard/reglages/kyc">Vérifier mon identité</Link>
        </Button>
      </div>
    )
  }

  if (!FEATURES.STRIPE_PAYMENTS) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Ajouter un compte bancaire"
          description="Recevez vos paiements directement sur votre compte."
        />
        <Alert>
          <AlertTitle>Paiements désactivés</AlertTitle>
          <AlertDescription>
            Les paiements Stripe sont désactivés pour le moment.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajouter un compte bancaire"
        description="Recevez vos paiements directement sur votre compte."
      />

      {showForm ? (
        <ConnectOnboardingForm
          onSuccess={() => setShowForm(false)}
        />
      ) : (
        <ConnectStatusDisplay onEdit={() => setShowForm(true)} />
      )}
    </div>
  )
}
