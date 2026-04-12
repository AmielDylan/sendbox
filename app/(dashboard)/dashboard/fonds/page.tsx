/**
 * Page de gestion des fonds utilisateur
 */

'use client'

import { useCallback, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { FinancialSummaryCard } from '@/components/features/dashboard/FinancialSummaryCard'
import { FEATURES } from '@/lib/shared/config/features'
import { useAuth } from '@/hooks/use-auth'
import {
  IconArrowRight,
  IconBuildingBank,
  IconCreditCard,
  IconDeviceMobile,
  IconLoader2,
} from '@tabler/icons-react'
import { fetchConnectStatus } from '@/lib/shared/stripe/connect-status-client'

const dashboardCardTitleClassName = 'text-[13px] font-medium tracking-tight'

type DashboardBadgeVariant = NonNullable<BadgeProps['variant']>

export default function FundsPage() {
  const { user, profile, loading, refetch } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const payoutsEnabled = Boolean(profile?.stripe_payouts_enabled)
  const payoutMethod = (profile as any)?.payout_method as
    | 'stripe_bank'
    | 'bank_transfer'
    | 'mobile_wallet'
    | undefined
  const payoutStatus = (profile as any)?.payout_status as
    | 'pending'
    | 'active'
    | 'disabled'
    | undefined
  const isStripeSelected = payoutMethod === 'stripe_bank'
  const isBankTransferSelected = payoutMethod === 'bank_transfer'
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

  const payoutMethodMeta = useMemo(() => {
    if (isStripeSelected) {
      return {
        label: 'Compte bancaire',
        description: 'Virements sur votre compte bancaire.',
        icon: IconBuildingBank,
      }
    }

    if (isBankTransferSelected) {
      return {
        label: 'Virement bancaire',
        description: 'Réception locale ou internationale.',
        icon: IconBuildingBank,
      }
    }

    if (isWalletSelected) {
      return {
        label: 'Mobile Wallet',
        description: 'Versements envoyés sur votre numéro.',
        icon: IconDeviceMobile,
      }
    }

    return {
      label: 'Non configuré',
      description: 'Ajoutez un mode de réception pour vos gains.',
      icon: IconCreditCard,
    }
  }, [isBankTransferSelected, isStripeSelected, isWalletSelected])

  const payoutStatusMeta = useMemo(() => {
    if (!canConfigurePayments) {
      return {
        label: 'Bloqué',
        description: 'KYC requis avant toute configuration.',
        variant: 'outline' as DashboardBadgeVariant,
      }
    }

    if (payoutStatus === 'active') {
      return {
        label: 'Actif',
        description: 'Votre mode de versement est prêt.',
        variant: 'success' as DashboardBadgeVariant,
      }
    }

    if (payoutStatus === 'pending') {
      return {
        label: 'En vérification',
        description: 'Une validation est encore en cours.',
        variant: 'warning' as DashboardBadgeVariant,
      }
    }

    return {
      label: 'À configurer',
      description: 'Choisissez votre mode de réception.',
      variant: 'secondary' as DashboardBadgeVariant,
    }
  }, [canConfigurePayments, payoutStatus])

  const kycMeta = useMemo(() => {
    if (kycStatus === 'approved') {
      return {
        label: 'Vérifiée',
        description: 'Votre identité est validée.',
        variant: 'success' as DashboardBadgeVariant,
      }
    }

    if (kycStatus === 'pending') {
      return {
        label: 'En cours',
        description: 'Examen des documents en cours.',
        variant: 'warning' as DashboardBadgeVariant,
      }
    }

    if (kycStatus === 'rejected') {
      return {
        label: 'À reprendre',
        description: 'Soumettez un nouveau justificatif.',
        variant: 'destructive' as DashboardBadgeVariant,
      }
    }

    return {
      label: 'Requise',
      description: 'Vérifiez votre identité pour débloquer les fonds.',
      variant: 'outline' as DashboardBadgeVariant,
    }
  }, [kycStatus])

  const primaryAction = useMemo(() => {
    if (!canConfigurePayments) {
      return {
        href: '/dashboard/reglages/kyc',
        label: 'Vérifier mon identité',
      }
    }

    if (!payoutMethod) {
      return {
        href: '/dashboard/reglages/paiements',
        label: 'Activer les paiements',
      }
    }

    if (payoutStatus === 'pending') {
      return {
        href: '/dashboard/reglages/paiements',
        label: 'Finaliser la vérification',
      }
    }

    if (isWalletSelected) {
      return {
        href: '/dashboard/reglages/paiements',
        label: 'Gérer mon wallet',
      }
    }

    return {
      href: '/dashboard/reglages/paiements',
      label: 'Gérer mes versements',
    }
  }, [canConfigurePayments, isWalletSelected, payoutMethod, payoutStatus])

  const nextStep = useMemo(() => {
    if (!canConfigurePayments) {
      return {
        title: 'Vérification d’identité requise',
        description:
          'Votre identité doit être validée avant l’activation des versements.',
      }
    }

    if (!payoutMethod) {
      return {
        title: 'Choisissez un mode de réception',
        description:
          'Ajoutez un compte bancaire ou un mobile wallet pour recevoir vos gains.',
      }
    }

    if (payoutStatus === 'pending') {
      return {
        title: 'Validation en cours',
        description:
          isWalletSelected || isBankTransferSelected
            ? 'Votre mode de réception est en cours de validation.'
            : 'Votre compte bancaire doit encore être vérifié.',
      }
    }

    return {
      title: 'Versements disponibles',
      description:
        'Vos prochains gains suivront ce mode de réception une fois débloqués.',
    }
  }, [
    canConfigurePayments,
    isBankTransferSelected,
    isWalletSelected,
    payoutMethod,
    payoutStatus,
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fonds"
        description="Suivez vos gains, vos fonds en attente et la configuration de vos versements."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Fonds' },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/reglages/paiements">
              Paramètres de paiement
            </Link>
          </Button>
        }
      />

      {!FEATURES.STRIPE_PAYMENTS && (
        <Alert className="border-border/70 bg-muted/40">
          <AlertTitle className="text-sm">Mode simulation actif</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            Les versements bancaires en ligne sont encore simulés dans cette
            version de l’outil.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3">
            <CardTitle className={dashboardCardTitleClassName}>
              Services effectués
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold">{completedServices}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Livraisons validées par les clients.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3">
            <CardTitle className={dashboardCardTitleClassName}>
              Mode de versement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <p className="text-base font-medium">{payoutMethodMeta.label}</p>
            <p className="text-xs text-muted-foreground">
              {payoutMethodMeta.description}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3">
            <CardTitle className={dashboardCardTitleClassName}>
              Activation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-2">
            <Badge variant={payoutStatusMeta.variant}>
              {payoutStatusMeta.label}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {payoutStatusMeta.description} Identité:{' '}
              {kycMeta.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-border/60 bg-card/40 shadow-none">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className={dashboardCardTitleClassName}>
                Réception des fonds
              </CardTitle>
              <CardDescription className="text-xs">
                Définissez comment vos gains vous sont reversés.
              </CardDescription>
            </div>
            <Badge variant={kycMeta.variant}>{kycMeta.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Méthode active
              </p>
              <div className="mt-2 flex items-center gap-2">
                <payoutMethodMeta.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{payoutMethodMeta.label}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {payoutMethodMeta.description}
              </p>
            </div>

            <div className="rounded-lg border border-border/60 bg-background p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Prochaine étape
              </p>
              <p className="mt-2 text-sm font-medium">{nextStep.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {nextStep.description}
              </p>
            </div>
          </div>

          <Button asChild>
            <Link href={primaryAction.href}>
              {primaryAction.label}
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <FinancialSummaryCard userId={user.id} role="traveler" />
      </div>
    </div>
  )
}
