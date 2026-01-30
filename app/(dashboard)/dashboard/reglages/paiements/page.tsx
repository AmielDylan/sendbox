/**
 * Page de configuration des paiements (Stripe Connect)
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  IconCircleCheck,
  IconAlertCircle,
  IconClock,
  IconLoader2,
} from '@tabler/icons-react'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from '@stripe/react-connect-js'
import { cn } from '@/lib/utils'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { toast } from 'sonner'

type KYCStatus = 'pending' | 'approved' | 'rejected' | 'incomplete' | null

export default function PaymentsSettingsPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [connectStatus, setConnectStatus] = useState<{
    payouts_enabled: boolean
    onboarding_completed: boolean
    requirements: any
  } | null>(null)
  const [isConnectLoading, setIsConnectLoading] = useState(true)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [connectAvailable, setConnectAvailable] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const kycStatus = (profile?.kyc_status ?? null) as KYCStatus
  const canConfigurePayments = kycStatus === 'approved'

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/connect/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: 'FR' }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(data?.error || "Impossible d'activer les paiements")
    }

    if (!data?.client_secret) {
      throw new Error('Client secret manquant')
    }

    return data.client_secret as string
  }, [])

  const connectInstance = useMemo(() => {
    if (!publishableKey) return null
    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret,
      appearance: {
        variables: {
          colorPrimary: '#0d9488',
          colorText: '#0f172a',
          colorDanger: '#dc2626',
          fontFamily: 'Space Grotesk, system-ui, sans-serif',
        },
      },
    })
  }, [fetchClientSecret, publishableKey])

  const loadConnectStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/connect/status')

      if (res.status === 403) {
        setConnectAvailable(false)
        setIsConnectLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error('Erreur lors du chargement')
      }

      const data = await res.json()
      setConnectStatus(data)
    } catch (error) {
      console.error('Connect status error:', error)
    } finally {
      setIsConnectLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!FEATURES.STRIPE_PAYMENTS || isAdmin || !canConfigurePayments) {
      setIsConnectLoading(false)
      return
    }

    loadConnectStatus()
  }, [canConfigurePayments, isAdmin, loadConnectStatus])

  const handleConnectOnboarding = async () => {
    if (!connectInstance) {
      toast.error('Clé Stripe manquante')
      return
    }
    setIsOnboarding(true)
    setShowOnboarding(true)
  }

  const connectBadgeLabel = isConnectLoading
    ? 'Chargement...'
    : connectStatus?.payouts_enabled
      ? 'Activé'
      : 'À compléter'

  const getKycBadge = () => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500 text-white">
            <IconCircleCheck className="mr-1 h-3 w-3" />
            Validé
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning">
            <IconClock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <IconAlertCircle className="mr-1 h-3 w-3" />
            Rejeté
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            À compléter
          </Badge>
        )
    }
  }

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ajouter un compte bancaire"
        description="Recevez vos paiements directement sur votre compte."
      />

      {!FEATURES.STRIPE_PAYMENTS && (
        <Alert>
          <AlertTitle>Paiements désactivés</AlertTitle>
          <AlertDescription>
            Les paiements Stripe sont désactivés pour le moment.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Paramètres de paiement</CardTitle>
              <CardDescription>
                Activez vos paiements pour recevoir vos gains.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {canConfigurePayments ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                <div>
                  <p className="font-medium text-foreground">
                    Compte bancaire
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recevez vos paiements directement.
                  </p>
                </div>
                <Badge
                  variant={
                    connectStatus?.payouts_enabled ? 'default' : 'warning'
                  }
                  className={cn(
                    connectStatus?.payouts_enabled && 'bg-green-500 text-white'
                  )}
                >
                  {connectBadgeLabel}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2">
                <p className="font-medium text-foreground">
                  Vérification d&apos;identité
                </p>
                <p className="text-xs text-muted-foreground">
                  Obligatoire pour recevoir vos gains.
                </p>
              </div>
            </div>
          )}

          {!connectAvailable && (
            <Alert>
              <AlertTitle>Action indisponible</AlertTitle>
              <AlertDescription>
                Cette option est réservée aux comptes utilisateurs.
              </AlertDescription>
            </Alert>
          )}

          {canConfigurePayments ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={handleConnectOnboarding}
                disabled={
                  isOnboarding ||
                  isConnectLoading ||
                  connectStatus?.payouts_enabled ||
                  !connectAvailable ||
                  !FEATURES.STRIPE_PAYMENTS
                }
              >
                {isOnboarding ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activation...
                  </>
                ) : connectStatus?.payouts_enabled ? (
                  'Paiements activés'
                ) : (
                  'Activer les paiements'
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Vérifiez vos informations d&apos;identité avant d&apos;ajouter
                un compte bancaire.
              </p>
              <Button asChild>
                <Link href="/dashboard/reglages/kyc">
                  Vérifier mon identité
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showOnboarding && connectInstance && (
        <Card>
          <CardHeader>
            <CardTitle>Configurer votre compte bancaire</CardTitle>
            <CardDescription>
              Renseignez votre RIB directement dans Sendbox.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectComponentsProvider connectInstance={connectInstance}>
              <ConnectAccountOnboarding
                onExit={() => {
                  setShowOnboarding(false)
                  setIsOnboarding(false)
                  void loadConnectStatus()
                }}
                onLoadError={({ error }) => {
                  console.error('Onboarding load error:', error)
                  toast.error("Impossible d'ouvrir la configuration Stripe")
                  setShowOnboarding(false)
                  setIsOnboarding(false)
                }}
                onLoaderStart={() => {
                  setIsOnboarding(true)
                }}
              />
            </ConnectComponentsProvider>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
