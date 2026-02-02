'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface StripeConnectCustomFlowProps {
  onCompleted?: () => void
}

export function StripeConnectCustomFlow({
  onCompleted,
}: StripeConnectCustomFlowProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [showPendingNotice, setShowPendingNotice] = useState(false)
  const longPollRef = useRef<number | null>(null)
  const longPollAttempts = useRef(0)
  const missingAccountNotified = useRef(false)
  const pollRef = useRef<number | null>(null)
  const { profile, refetch } = useAuth()
  const profileRef = useRef(profile)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const connectInstance = useMemo(() => {
    if (!clientSecret || !publishableKey) return null

    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => clientSecret,
    })
  }, [clientSecret, publishableKey])

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }

  const stopLongPolling = () => {
    if (longPollRef.current) {
      window.clearInterval(longPollRef.current)
      longPollRef.current = null
    }
    longPollAttempts.current = 0
  }

  const startLongPolling = () => {
    if (longPollRef.current) return
    longPollRef.current = window.setInterval(async () => {
      longPollAttempts.current += 1
      try {
        const res = await fetch('/api/connect/status')
        const data = await res.json().catch(() => ({}))
        if (res.ok && (data?.payouts_enabled || data?.payout_status === 'active')) {
          await refetch()
          toast.success('Paiements Stripe activés.')
          stopLongPolling()
          return
        }

        if (!res.ok) {
          toast.error(
            data?.error || 'Impossible de vérifier la création du compte Stripe.'
          )
        }

        await refetch()

        const latestProfile = profileRef.current as any
        if (
          !latestProfile?.stripe_connect_account_id &&
          !missingAccountNotified.current
        ) {
          toast.error('Compte Stripe non créé. Reprenez la vérification.')
          missingAccountNotified.current = true
        }
      } catch (error) {
        console.error('Stripe status polling error:', error)
      }
    }, 300000)
  }

  const startPolling = () => {
    if (pollRef.current) return
    setIsPolling(true)
    let attempts = 0
    pollRef.current = window.setInterval(async () => {
      attempts += 1
      try {
        const res = await fetch('/api/connect/status')
        const data = await res.json().catch(() => ({}))
        if (res.ok && (data?.payouts_enabled || data?.payout_status === 'active')) {
          await refetch()
          toast.success('Paiements Stripe activés.')
          stopPolling()
          return
        }
      } catch (error) {
        console.error('Stripe status polling error:', error)
      }

      if (attempts >= 15) {
        stopPolling()
      }
    }, 4000)
  }

  useEffect(() => {
    const payoutStatus = (profile as any)?.payout_status as
      | 'active'
      | 'pending'
      | 'disabled'
      | undefined
    if (payoutStatus === 'active') {
      stopPolling()
      stopLongPolling()
    }
  }, [profile])

  useEffect(() => {
    return () => {
      stopPolling()
      stopLongPolling()
    }
  }, [])

  useEffect(() => {
    const payoutStatus = (profile as any)?.payout_status as
      | 'active'
      | 'pending'
      | 'disabled'
      | undefined

    if (!showPendingNotice || payoutStatus === 'active') {
      stopLongPolling()
      return
    }

    startLongPolling()
    return () => stopLongPolling()
  }, [showPendingNotice, profile])

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
      missingAccountNotified.current = false
      setShowPendingNotice(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!clientSecret && (
        <ConnectOnboardingForm
          onSubmit={handleSubmit}
          onSuccess={() => {
            if (!loading) {
              toast.success('Formulaire envoyé. Continuer la vérification.')
            }
          }}
        />
      )}

      {clientSecret && connectInstance ? (
        <Card>
          <CardHeader>
            <CardTitle>Vérification Stripe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Cliquez sur le bouton ci-dessous pour continuer la vérification.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertDescription>
                Finalisez la vérification directement dans Sendbox. Stripe vous
                demandera des informations complémentaires si nécessaire.
              </AlertDescription>
            </Alert>
            {showPendingNotice && (
              <Alert>
                <AlertDescription>
                  La vérification de vos informations bancaires est en cours.
                  Ce processus peut prendre jusqu’à 24h. Aucune de vos
                  informations bancaires n’est conservée par Sendbox dans le
                  cadre de cette vérification.
                </AlertDescription>
              </Alert>
            )}
            <ConnectComponentsProvider connectInstance={connectInstance}>
              <ConnectAccountOnboarding
                onExit={async () => {
                  toast.success('Vérification terminée.')
                  await fetch('/api/connect/status').catch(() => null)
                  onCompleted?.()
                  startPolling()
                }}
              />
            </ConnectComponentsProvider>
            <Button
              variant="outline"
              onClick={() => {
                setClientSecret(null)
                setShowPendingNotice(false)
              }}
            >
              Modifier mes informations
            </Button>
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
