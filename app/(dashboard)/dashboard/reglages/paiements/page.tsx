/**
 * Page de configuration des paiements (Stripe Connect + Mobile Wallet)
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconBuildingBank,
  IconDeviceMobile,
  IconCheck,
} from '@tabler/icons-react'
import { PageHeader } from '@/components/ui/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import { StripeConnectCustomFlow } from '@/components/features/payments/StripeConnectCustomFlow'
import { MobileWalletSetup } from '@/components/features/payments/MobileWalletSetup'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null

type PayoutMethod = 'stripe_bank' | 'mobile_wallet'

type MethodCard = {
  id: PayoutMethod
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export default function PaymentsSettingsPage() {
  const { profile, refetch } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const kycStatus = (profile?.kyc_status ?? null) as KYCStatus
  const canConfigurePayments = kycStatus === 'approved'

  const currentMethod = (profile as any)?.payout_method as
    | PayoutMethod
    | undefined
  const currentStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | 'disabled'
    | undefined

  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod | null>(
    currentMethod ?? null
  )
  const [step, setStep] = useState<'select' | 'details'>(
    currentMethod ? 'details' : 'select'
  )

  useEffect(() => {
    if (currentMethod) {
      setSelectedMethod(currentMethod)
      setStep('details')
    }
  }, [currentMethod])

  const methods = useMemo<MethodCard[]>(
    () => [
      {
        id: 'stripe_bank',
        title: 'Compte Bancaire',
        description: 'Virement international SEPA via Stripe.',
        icon: IconBuildingBank,
        disabled: !FEATURES.STRIPE_PAYMENTS,
      },
      {
        id: 'mobile_wallet',
        title: 'Mobile Wallet',
        description: 'MTN, Moov, Celtis via FedaPay.',
        icon: IconDeviceMobile,
      },
    ],
    []
  )

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Paramètres de Paiement"
          description="Configurez vos méthodes de réception des fonds."
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
          title="Paramètres de Paiement"
          description="Choisissez votre méthode de réception des fonds."
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Paramètres de Paiement"
        description="Sélectionnez votre mode de réception puis finalisez la vérification."
      />

      {!FEATURES.STRIPE_PAYMENTS && (
        <Alert>
          <AlertTitle>Stripe désactivé</AlertTitle>
          <AlertDescription>
            Les paiements Stripe sont désactivés pour le moment. Utilisez Mobile
            Wallet pour recevoir vos gains.
          </AlertDescription>
        </Alert>
      )}

      {step === 'select' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {methods.map(method => {
              const selected = selectedMethod === method.id
              const disabled = Boolean(method.disabled)
              const Icon = method.icon
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => !disabled && setSelectedMethod(method.id)}
                  className={`relative rounded-xl border bg-background p-5 text-left transition hover:border-primary/60 hover:shadow-sm focus:outline-none ${
                    selected
                      ? 'border-primary ring-2 ring-primary/30 shadow-sm'
                      : 'border-border'
                  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {selected && (
                    <span className="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <IconCheck className="h-4 w-4" />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{method.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                  {currentMethod === method.id && currentStatus && (
                    <Badge className="mt-4" variant="secondary">
                      {currentStatus === 'active'
                        ? 'Actif'
                        : currentStatus === 'pending'
                          ? 'En cours de vérification'
                          : 'Désactivé'}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {selectedMethod && (
            <Button onClick={() => setStep('details')}>Continuer</Button>
          )}
        </div>
      )}

      {step === 'details' && selectedMethod && (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {selectedMethod === 'stripe_bank'
                    ? 'Compte Bancaire'
                    : 'Mobile Wallet'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMethod === 'stripe_bank'
                    ? 'Renseignez vos informations et finalisez la vérification Stripe.'
                    : 'Choisissez votre opérateur et validez votre numéro par OTP.'}
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep('select')}>
                Changer de mode
              </Button>
            </div>

            {selectedMethod === 'stripe_bank' ? (
              <StripeConnectCustomFlow
                onCompleted={async () => {
                  await refetch()
                }}
              />
            ) : (
              <MobileWalletSetup
                onCompleted={async () => {
                  await refetch()
                }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
