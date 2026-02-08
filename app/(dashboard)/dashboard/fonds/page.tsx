/**
 * Page de gestion des fonds utilisateur
 */

'use client'

import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FinancialSummaryCard } from '@/components/features/dashboard/FinancialSummaryCard'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import { IconLoader2 } from '@tabler/icons-react'
import { fetchConnectStatus } from '@/lib/shared/stripe/connect-status-client'

export default function FundsPage() {
  const { user, profile, loading, refetch } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const payoutsEnabled = Boolean(profile?.stripe_payouts_enabled)
  const payoutMethod = (profile as any)?.payout_method as
    | 'stripe_bank'
    | 'mobile_wallet'
    | undefined
  const payoutStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | 'disabled'
    | undefined
  const isStripeSelected = payoutMethod === 'stripe_bank'
  const isWalletSelected = payoutMethod === 'mobile_wallet'

  const kycStatus = (profile?.kyc_status ?? null) as
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'incomplete'
    | null
  const canConfigurePayments = kycStatus === 'approved'

  const refreshConnectStatus = useCallback(async () => {
    const res = await fetchConnectStatus('funds')
    if (!res) return
    if (!res.ok) {
      throw new Error('Erreur lors du chargement')
    }
    await res.json()
    await refetch()
  }, [refetch])

  useEffect(() => {
    if (
      !FEATURES.STRIPE_PAYMENTS ||
      isAdmin ||
      !canConfigurePayments ||
      !isStripeSelected
    ) {
      return
    }

    if (!user?.id || payoutsEnabled) {
      return
    }

    const loadConnectStatus = async () => {
      try {
        await refreshConnectStatus()
      } catch (error) {
        console.error('Connect status error:', error)
      }
    }

    loadConnectStatus()
  }, [
    canConfigurePayments,
    isAdmin,
    isStripeSelected,
    payoutsEnabled,
    refreshConnectStatus,
    user?.id,
  ])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Fonds"
          description="Suivez vos gains et versements."
        />
        <Alert>
          <AlertTitle>Réservé aux utilisateurs</AlertTitle>
          <AlertDescription>
            La gestion des fonds est disponible uniquement pour les comptes
            utilisateurs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const completedServices =
    profile?.completed_services ?? profile?.total_services ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fonds"
        description="Suivez vos gains, vos fonds en attente et déclenchez vos virements."
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
          <CardTitle>Résumé des gains</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Services effectués
            </p>
            <p className="text-3xl font-bold">{completedServices}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Livraisons validées par les clients.
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-4 flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Virement
            </p>
            {canConfigurePayments ? (
              <>
                {isStripeSelected && (
                  <Button asChild>
                    <Link href="/dashboard/reglages/paiements">
                      {payoutStatus === 'active'
                        ? 'Gérer mon compte bancaire'
                        : 'Finaliser la vérification'}
                    </Link>
                  </Button>
                )}
                {isWalletSelected && (
                  <Button asChild>
                    <Link href="/dashboard/reglages/paiements">
                      Gérer mon Mobile Wallet
                    </Link>
                  </Button>
                )}
                {!payoutMethod && (
                  <Button asChild>
                    <Link href="/dashboard/reglages/paiements">
                      Activer les paiements
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <Button asChild>
                <Link href="/dashboard/reglages/kyc">
                  Vérifier mon identité
                </Link>
              </Button>
            )}
            {!canConfigurePayments && (
              <p className="text-xs text-muted-foreground">
                Activez votre identité pour débloquer les virements.
              </p>
            )}
            {canConfigurePayments && payoutStatus === 'pending' && (
              <p className="text-xs text-muted-foreground">
                Vérification en cours pour {isWalletSelected ? 'le wallet' : 'le compte bancaire'}.
              </p>
            )}
            {canConfigurePayments && payoutStatus === 'active' && isWalletSelected && (
              <p className="text-xs text-muted-foreground">
                Mobile Wallet vérifié. Les paiements seront envoyés sur votre numéro.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancialSummaryCard userId={user.id} role="traveler" />
        <FinancialSummaryCard userId={user.id} role="requester" />
      </div>
    </div>
  )
}
