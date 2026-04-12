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
import { getStripeClient } from '@/lib/shared/services/stripe/config'
import { fetchConnectStatus } from '@/lib/shared/stripe/connect-status-client'
import type { Stripe } from '@stripe/stripe-js'

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
  const [identityLoading, setIdentityLoading] = useState(false)
  const longPollRef = useRef<number | null>(null)
  const longPollAttempts = useRef(0)
  const missingAccountNotified = useRef(false)
  const pollRef = useRef<number | null>(null)
  const { profile, refetch } = useAuth()
  const profileRef = useRef(profile)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

  const stripePromise = useMemo(() => getStripeClient(), [])

  const parseDob = (value?: string | null) => {
    if (!value) return null
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!match) return null
    const [, year, month, day] = match
    return {
      day: Number(day),
      month: Number(month),
      year: Number(year),
    }
  }

  const buildIndividualPayload = () => {
    const individual: Record<string, unknown> = {}
    const firstName = (profile as any)?.firstname as string | undefined
    const lastName = (profile as any)?.lastname as string | undefined
    const email = (profile as any)?.email as string | undefined
    const phone = (profile as any)?.phone as string | undefined
    const address = (profile as any)?.address as string | undefined
    const city = (profile as any)?.city as string | undefined
    const postalCode = (profile as any)?.postal_code as string | undefined
    const country = (profile as any)?.country as string | undefined
    const birthday = (profile as any)?.birthday as string | undefined

    if (firstName?.trim()) individual.first_name = firstName.trim()
    if (lastName?.trim()) individual.last_name = lastName.trim()
    if (email?.trim()) individual.email = email.trim()
    if (phone?.trim()) individual.phone = phone.trim()
    const dob = parseDob(birthday)
    if (dob) individual.dob = dob

    if (address?.trim() || city?.trim() || postalCode?.trim()) {
      individual.address = {
        line1: address?.trim() || undefined,
        city: city?.trim() || undefined,
        postal_code: postalCode?.trim() || undefined,
        country: country?.trim() || undefined,
      }
    }

    return individual
  }

  const createAccountToken = async (stripe: Stripe) => {
    const accountPayload = {
      business_type: 'individual',
      tos_shown_and_accepted: true,
    } as any
    const individual = buildIndividualPayload()
    if (Object.keys(individual).length > 0) {
      accountPayload.individual = individual
    }

    const tokenResult = await stripe.createToken('account', accountPayload)
    if (tokenResult.error || !tokenResult.token?.id) {
      throw new Error(
        tokenResult.error?.message ||
          'Impossible de préparer le compte de paiement.'
      )
    }

    return tokenResult.token.id
  }

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
        const res = await fetchConnectStatus('connect_longpoll')
        if (!res) return
        const data = await res.json().catch(() => ({}))
        if (
          res.ok &&
          (data?.payouts_enabled || data?.payout_status === 'active')
        ) {
          await refetch()
          toast.success('Paiements activés.')
          stopLongPolling()
          return
        }

        if (!res.ok) {
          toast.error(
            data?.error ||
              'Impossible de vérifier la création du compte de paiement.'
          )
        }

        await refetch()

        const latestProfile = profileRef.current as any
        if (
          !latestProfile?.stripe_connect_account_id &&
          !missingAccountNotified.current
        ) {
          toast.error('Compte de paiement non créé. Reprenez la vérification.')
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
        const res = await fetchConnectStatus('connect_poll')
        if (!res) return
        const data = await res.json().catch(() => ({}))
        if (
          res.ok &&
          (data?.payouts_enabled || data?.payout_status === 'active')
        ) {
          await refetch()
          toast.success('Paiements activés.')
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
    const payoutErrorCode = (profile as any)?.payout_error_code as
      | string
      | null
      | undefined
    const payoutErrorMessage = (profile as any)?.payout_error_message as
      | string
      | null
      | undefined
    if (payoutStatus === 'active' || payoutErrorCode || payoutErrorMessage) {
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
    const payoutErrorCode = (profile as any)?.payout_error_code as
      | string
      | null
      | undefined
    const payoutErrorMessage = (profile as any)?.payout_error_message as
      | string
      | null
      | undefined

    if (
      !showPendingNotice ||
      payoutStatus === 'active' ||
      payoutErrorCode ||
      payoutErrorMessage
    ) {
      stopLongPolling()
      return
    }

    startLongPolling()
    return () => stopLongPolling()
  }, [showPendingNotice, profile])

  const requirements = (profile as any)?.stripe_requirements as
    | {
        currently_due?: string[]
        eventually_due?: string[]
        pending_verification?: string[]
        past_due?: string[]
      }
    | undefined

  const requiresIdentityVerification = useMemo(() => {
    if (!requirements) return false
    const allRequirements = [
      ...(requirements.currently_due ?? []),
      ...(requirements.pending_verification ?? []),
      ...(requirements.past_due ?? []),
    ]
    return allRequirements.some(
      field =>
        field.startsWith('individual.verification') ||
        field.startsWith('person.verification')
    )
  }, [requirements])

  const startIdentityVerification = async () => {
    if (identityLoading) return
    setIdentityLoading(true)
    try {
      const res = await fetch('/api/connect/identity', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de démarrer la vérification')
      }

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Le service de vérification n'est pas disponible")
      }

      const { error } = await stripe.verifyIdentity(data.client_secret)
      if (error) {
        throw new Error(
          error.message ||
            "La vérification d'identité n'a pas pu être complétée."
        )
      }

      toast.success('Vérification envoyée.')
      await fetchConnectStatus('connect_identity').catch(() => null)
      await refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIdentityLoading(false)
    }
  }

  const handleSubmit = async (payload: ConnectOnboardingPayload) => {
    setLoading(true)
    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Le service de paiement n'est pas disponible.")
      }

      const accountTokenId = await createAccountToken(stripe)

      const res = await fetch('/api/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, accountTokenId }),
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
        throw new Error('Clé de vérification indisponible')
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
      {requiresIdentityVerification && (
        <Alert>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Une vérification d&apos;identité est nécessaire pour éviter une
              interruption des virements.
            </span>
            <div>
              <Button
                onClick={startIdentityVerification}
                disabled={identityLoading}
              >
                {identityLoading
                  ? 'Vérification en cours...'
                  : 'Vérifier mon identité'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
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

      {clientSecret ? (
        connectInstance ? (
          <Card>
            <CardHeader>
              <CardTitle>Vérification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  Cliquez sur le bouton ci-dessous pour continuer la
                  vérification.
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription>
                  Finalisez la vérification directement dans Sendbox. Des
                  informations complémentaires pourront être demandées si
                  nécessaire.
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
                    await fetchConnectStatus('connect_onboarding_exit').catch(
                      () => null
                    )
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
                ? 'Configuration de paiement en cours. Réessayez.'
                : 'Configuration de paiement manquante.'}
            </AlertDescription>
          </Alert>
        )
      ) : null}
    </div>
  )
}
