/**
 * Page de gestion des fonds utilisateur
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FinancialSummaryCard } from '@/components/features/dashboard/FinancialSummaryCard'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { IconLoader2 } from '@tabler/icons-react'

export default function FundsPage() {
  const { user, profile, loading, refetch } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [isConnectLoading, setIsConnectLoading] = useState(true)
  const [isOpeningPayout, setIsOpeningPayout] = useState(false)
  const payoutsEnabled = Boolean(profile?.stripe_payouts_enabled)

  const kycStatus = (profile?.kyc_status ?? null) as
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'incomplete'
    | null
  const canConfigurePayments = kycStatus === 'approved'

  const refreshConnectStatus = useCallback(async () => {
    const res = await fetch('/api/connect/status')
    if (!res.ok) {
      throw new Error('Erreur lors du chargement')
    }
    await res.json()
    await refetch()
  }, [refetch])

  useEffect(() => {
    if (!FEATURES.STRIPE_PAYMENTS || isAdmin || !canConfigurePayments) {
      setIsConnectLoading(false)
      return
    }

    if (!user?.id || payoutsEnabled) {
      setIsConnectLoading(false)
      return
    }

    let isActive = true

    const loadConnectStatus = async () => {
      try {
        await refreshConnectStatus()
      } catch (error) {
        console.error('Connect status error:', error)
      } finally {
        if (isActive) {
          setIsConnectLoading(false)
        }
      }
    }

    setIsConnectLoading(true)
    loadConnectStatus()

    return () => {
      isActive = false
    }
  }, [
    canConfigurePayments,
    isAdmin,
    payoutsEnabled,
    refreshConnectStatus,
    user?.id,
  ])

  const handlePayout = async () => {
    setIsOpeningPayout(true)
    try {
      const res = await fetch('/api/connect/login-link', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data?.error || "Impossible d'ouvrir les virements")
        return
      }
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Lien de virement indisponible')
      }
    } catch (error) {
      console.error('Payout link error:', error)
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsOpeningPayout(false)
    }
  }

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
              <Button
                onClick={handlePayout}
                disabled={
                  isOpeningPayout ||
                  isConnectLoading ||
                  !payoutsEnabled
                }
              >
                {isOpeningPayout ? 'Ouverture...' : 'Virer sur mon compte'}
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/reglages/kyc">
                  Vérifier mon identité
                </Link>
              </Button>
            )}
            {canConfigurePayments && !payoutsEnabled && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/reglages/paiements">
                  Activer les paiements
                </Link>
              </Button>
            )}
            {!canConfigurePayments && (
              <p className="text-xs text-muted-foreground">
                Activez votre identité pour débloquer les virements.
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
