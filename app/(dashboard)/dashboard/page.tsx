/**
 * Page d'accueil du dashboard
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/shared/db/client'
import { PageHeader } from '@/components/ui/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  IconMessage,
  IconTrendingUp,
  IconUserShield,
  IconPlaneDeparture,
  IconSpeakerphone,
} from '@tabler/icons-react'
import { KYCAlertBanner } from '@/components/features/kyc/KYCAlertBanner'
import { FinancialSummaryCard } from '@/components/features/dashboard/FinancialSummaryCard'
import { isFeatureEnabled } from '@/lib/shared/config/features'
import {
  calculateRequesterFinancials,
  calculateTravelerFinancials,
} from '@/lib/core/bookings/financial-calculations'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { KYCStatus } from '@/types'
import type { Database } from '@/types/database.types'
import { Bar, BarChart, XAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

type BookingStatus = Database['public']['Enums']['booking_status']

type StatusCounts = Record<BookingStatus, number>

type Booking = Database['public']['Tables']['bookings']['Row']
type BookingRow = Pick<
  Booking,
  | 'id'
  | 'status'
  | 'sender_id'
  | 'traveler_id'
  | 'total_price'
  | 'commission_amount'
  | 'insurance_premium'
  | 'delivery_confirmed_at'
  | 'paid_at'
>

type DashboardStats = {
  activeAnnouncements: number
  unreadMessages: number
  travelerAvailable: number
  requesterBlocked: number
  hasTravelerBookings: boolean
  hasRequesterBookings: boolean
  sentStatus: StatusCounts
  receivedStatus: StatusCounts
  packagesStatus: StatusCounts
}

const createEmptyStatusCounts = (): StatusCounts => ({
  pending: 0,
  accepted: 0,
  matched: 0,
  confirmed: 0,
  payment_pending: 0,
  refused: 0,
  paid: 0,
  deposited: 0,
  handed: 0,
  in_transit: 0,
  delivered: 0,
  completed: 0,
  cancelled: 0,
  disputed: 0,
})

const countByStatus = (bookings: BookingRow[]) => {
  const counts = createEmptyStatusCounts()
  bookings.forEach(booking => {
    if (counts[booking.status] !== undefined) {
      counts[booking.status] += 1
    }
  })
  return counts
}

const sumCounts = (counts: StatusCounts) =>
  Object.values(counts).reduce((sum, value) => sum + value, 0)

const dashboardCardTitleClassName = 'text-[13px] font-medium tracking-tight'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(
    null
  )
  const [stats, setStats] = useState<DashboardStats>({
    activeAnnouncements: 0,
    unreadMessages: 0,
    travelerAvailable: 0,
    requesterBlocked: 0,
    hasTravelerBookings: false,
    hasRequesterBookings: false,
    sentStatus: createEmptyStatusCounts(),
    receivedStatus: createEmptyStatusCounts(),
    packagesStatus: createEmptyStatusCounts(),
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    // Gérer l'alert de vérification email
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const verified = params.get('verified')
      console.log('[Dashboard] Checking verified param:', verified)

      if (verified === 'true') {
        console.log('[Dashboard] Showing verification success toast')
        toast.success('Inscription réussie !', {
          description:
            'Votre email a été vérifié avec succès. Bienvenue sur Sendbox !',
          duration: 5000,
        })
        // Supprimer le paramètre de l'URL
        window.history.replaceState({}, '', '/dashboard')
      }
    }
  }, [])

  // Synchronise kycStatus depuis le store Zustand — OptimizedAuthProvider le met à jour via realtime
  useEffect(() => {
    if (profile) {
      const verificationStatus = (profile as any).verification_status
      const rawKycStatus = (profile as any).kyc_status as KYCStatus
      // verification_status est la source de vérité — kyc_status peut être désynchronisé
      // pour les comptes vérifiés avant qu'on ajoute la mise à jour de kyc_status dans resolve
      setKycStatus(
        verificationStatus === 'verified' ? 'approved' : (rawKycStatus ?? null)
      )
      setKycRejectionReason((profile as any).kyc_rejection_reason || null)
    }
  }, [profile])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        return
      }

      setIsLoadingStats(true)
      const supabase = createClient()

      try {
        const [announcementsResult, unreadResult, bookingsResult] =
          await Promise.all([
            supabase
              .from('announcements')
              .select('id', { count: 'exact', head: true })
              .eq('traveler_id', user.id)
              .in('status', ['active', 'partially_booked', 'fully_booked']),
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('receiver_id', user.id)
              .eq('is_read', false),
            supabase
              .from('bookings')
              .select(
                'id, status, sender_id, traveler_id, total_price, commission_amount, insurance_premium, delivery_confirmed_at, paid_at'
              )
              .or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`),
          ])

        const bookings = (bookingsResult.data as BookingRow[]) || []
        const sentBookings = bookings.filter(
          booking => booking.sender_id === user.id
        )
        const receivedBookings = bookings.filter(
          booking => booking.traveler_id === user.id
        )
        const travelerFinancials = calculateTravelerFinancials(
          receivedBookings as Booking[]
        )
        const requesterFinancials = calculateRequesterFinancials(
          sentBookings as Booking[]
        )
        const sentStatus = countByStatus(sentBookings)
        const receivedStatus = countByStatus(receivedBookings)

        setStats({
          activeAnnouncements: announcementsResult.count || 0,
          unreadMessages: unreadResult.count || 0,
          travelerAvailable: travelerFinancials.availableAmount,
          requesterBlocked: requesterFinancials.totalBlocked,
          hasTravelerBookings: receivedBookings.length > 0,
          hasRequesterBookings: sentBookings.length > 0,
          sentStatus,
          receivedStatus,
          packagesStatus: sentStatus,
        })
      } catch (error) {
        console.error('Dashboard data load error:', error)
        toast.error('Erreur lors du chargement des statistiques')
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  const receivedAcceptedTotal =
    stats.receivedStatus.accepted +
    stats.receivedStatus.paid +
    stats.receivedStatus.deposited +
    stats.receivedStatus.in_transit +
    stats.receivedStatus.delivered
  const showTravelerSummary = stats.hasTravelerBookings
  const showRequesterSummary = stats.hasRequesterBookings
  const summaryColumns =
    showTravelerSummary && showRequesterSummary
      ? 'md:grid-cols-2'
      : 'md:grid-cols-1'

  // Configuration des charts
  const receivedRequestChartData = [
    {
      status: 'En attente',
      value: stats.receivedStatus.pending,
      fill: 'var(--chart-1)',
    },
    {
      status: 'Acceptées',
      value: receivedAcceptedTotal,
      fill: 'var(--chart-2)',
    },
    {
      status: 'Annulées',
      value: stats.receivedStatus.cancelled,
      fill: 'var(--chart-5)',
    },
  ]

  const receivedRequestChartConfig = {
    value: { label: 'Demandes' },
    pending: { label: 'En attente', color: 'var(--chart-1)' },
    accepted: { label: 'Acceptées', color: 'var(--chart-2)' },
    cancelled: { label: 'Annulées', color: 'var(--chart-5)' },
  } satisfies ChartConfig

  const packagesChartData = [
    {
      status: 'À payer',
      value: stats.packagesStatus.accepted,
      fill: 'var(--chart-1)',
    },
    {
      status: 'Envoyés',
      value: stats.packagesStatus.paid + stats.packagesStatus.deposited,
      fill: 'var(--chart-2)',
    },
    {
      status: 'En transit',
      value: stats.packagesStatus.in_transit,
      fill: 'var(--chart-3)',
    },
    {
      status: 'Livrés',
      value: stats.packagesStatus.delivered,
      fill: 'var(--chart-4)',
    },
    {
      status: 'Annulés',
      value: stats.packagesStatus.cancelled,
      fill: 'var(--chart-5)',
    },
  ]

  const packagesChartConfig = {
    value: { label: 'Colis' },
    accepted: { label: 'À payer', color: 'var(--chart-1)' },
    sent: { label: 'Envoyés', color: 'var(--chart-2)' },
    in_transit: { label: 'En transit', color: 'var(--chart-3)' },
    delivered: { label: 'Livrés', color: 'var(--chart-4)' },
    cancelled: { label: 'Annulés', color: 'var(--chart-5)' },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité Sendbox"
        titleClassName="text-xl font-semibold sm:text-2xl"
        descriptionClassName="text-sm"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Tableau de bord' },
        ]}
        actions={
          <Button asChild>
            <Link href="/dashboard/annonces/new">
              <IconPlaneDeparture className="mr-2 h-4 w-4" />
              Enregistrer un voyage
            </Link>
          </Button>
        }
      />

      {/* Alert Banner KYC - SEULEMENT si feature activée */}
      {isFeatureEnabled('KYC_ENABLED') && (
        <KYCAlertBanner
          kycStatus={kycStatus}
          rejectionReason={kycRejectionReason}
        />
      )}

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4">
        {/* Card KYC Status - SEULEMENT si feature activée */}
        {isFeatureEnabled('KYC_ENABLED') && kycStatus !== 'approved' && (
          <Card className="flex-1 min-w-[200px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={dashboardCardTitleClassName}>
                Vérification d'identité
              </CardTitle>
              <IconUserShield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kycStatus === 'pending' && (
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-normal text-yellow-700 border-yellow-400 bg-yellow-50"
                  >
                    En cours
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Vérification sous 24-48h
                  </p>
                </div>
              )}
              {(!kycStatus ||
                kycStatus === 'incomplete' ||
                kycStatus === 'rejected') && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Vérifiez votre identité
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/dashboard/reglages/kyc">Commencer →</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={dashboardCardTitleClassName}>
              Annonces actives
            </CardTitle>
            <IconSpeakerphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '—' : stats.activeAnnouncements}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAnnouncements > 1
                ? 'annonces publiées'
                : 'annonce publiée'}
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={dashboardCardTitleClassName}>
              Messages
            </CardTitle>
            <IconMessage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '—' : stats.unreadMessages}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.unreadMessages > 1 ? 'messages non lus' : 'message non lu'}
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={dashboardCardTitleClassName}>
              {showTravelerSummary ? 'Revenus' : 'Fonds bloqués'}
            </CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats
                ? '—'
                : `€${(showTravelerSummary ? stats.travelerAvailable : stats.requesterBlocked).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {showTravelerSummary
                ? 'disponible maintenant (net Sendbox)'
                : 'montant net destiné au voyageur'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Widgets */}
      {user?.id && (showTravelerSummary || showRequesterSummary) && (
        <div className={`grid gap-6 ${summaryColumns}`}>
          {showTravelerSummary && (
            <FinancialSummaryCard userId={user.id} role="traveler" />
          )}
          {showRequesterSummary && (
            <FinancialSummaryCard userId={user.id} role="requester" />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[300px] rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3 space-y-1">
            <CardTitle className={dashboardCardTitleClassName}>
              Demandes reçues
            </CardTitle>
            <CardDescription className="text-xs">
              Demandes sur vos annonces publiées
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total</span>
              <span className="font-semibold text-foreground">
                {isLoadingStats ? '—' : sumCounts(stats.receivedStatus)}
              </span>
            </div>
            <ChartContainer
              config={receivedRequestChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={receivedRequestChartData}>
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[300px] rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3 space-y-1">
            <CardTitle className={dashboardCardTitleClassName}>Colis</CardTitle>
            <CardDescription className="text-xs">
              Suivi après acceptation et paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total suivis</span>
              <span className="font-semibold text-foreground">
                {isLoadingStats
                  ? '—'
                  : packagesChartData.reduce(
                      (sum, item) => sum + item.value,
                      0
                    )}
              </span>
            </div>
            <ChartContainer
              config={packagesChartConfig}
              className="h-[200px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={packagesChartData}
                layout="horizontal"
              >
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
