'use client'

import { useMemo, useState } from 'react'
import { loadConnectAndInitialize } from '@stripe/connect-js/pure'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js'
import {
  ConnectOnboardingForm,
  type ConnectOnboardingPayload,
} from '@/components/features/payments/ConnectOnboardingForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface StripeConnectCustomFlowProps {
  onCompleted?: () => void
}

export function StripeConnectCustomFlow({
  onCompleted,
}: StripeConnectCustomFlowProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const connectInstance = useMemo(() => {
    if (!clientSecret || !publishableKey) return null

    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => clientSecret,
    })
  }, [clientSecret, publishableKey])

  const handleSubmit = async (payload: ConnectOnboardingPayload) => {
    setLoading(true)
    try {
      const res = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Erreur lors de la création de l'onboarding"
        )
      }

      if (!data?.client_secret) {
        throw new Error('Client secret Stripe indisponible')
      }

      setClientSecret(data.client_secret)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ConnectOnboardingForm
        onSubmit={handleSubmit}
        onSuccess={() => {
          if (!loading) {
            toast.success('Formulaire envoyé. Continuer la vérification.')
          }
        }}
      />

      {clientSecret && connectInstance ? (
        <Card>
          <CardHeader>
            <CardTitle>Vérification Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Finalisez la vérification directement dans Sendbox. Stripe vous
                demandera des informations complémentaires si nécessaire.
              </AlertDescription>
            </Alert>
            <ConnectComponentsProvider connectInstance={connectInstance}>
              <ConnectAccountOnboarding
                onExit={async () => {
                  toast.success('Vérification terminée.')
                  await fetch('/api/connect/status').catch(() => null)
                  onCompleted?.()
                }}
              />
            </ConnectComponentsProvider>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertDescription>
            {publishableKey
              ? 'Remplissez le formulaire pour lancer la vérification Stripe.'
              : 'Clé Stripe manquante. Vérifiez la configuration.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
