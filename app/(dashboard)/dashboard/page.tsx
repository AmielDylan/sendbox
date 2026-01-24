/**
 * Page d'accueil du dashboard
 */

'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from "@/lib/shared/db/client"
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
import { IconPackage, IconMessage, IconTrendingUp, IconShield, IconCheck, IconClock } from '@tabler/icons-react'
import { KYCAlertBanner } from '@/components/features/kyc/KYCAlertBanner'
import { FinancialSummaryCard } from '@/components/features/dashboard/FinancialSummaryCard'
import { isFeatureEnabled } from "@/lib/shared/config/features"
import { calculateRequesterFinancials, calculateTravelerFinancials } from '@/lib/core/bookings/financial-calculations'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { KYCStatus } from '@/types'
import type { Database } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Bar, BarChart, XAxis } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

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

type RecentNotification = {
  id: string
  title: string
  content: string
  created_at: string | null
  booking_id: string | null
  link: string | null
}

const createEmptyStatusCounts = (): StatusCounts => ({
  pending: 0,
  accepted: 0,
  refused: 0,
  paid: 0,
  deposited: 0,
  in_transit: 0,
  delivered: 0,
  cancelled: 0,
  disputed: 0,
})

const countByStatus = (bookings: BookingRow[]) => {
  const counts = createEmptyStatusCounts()
  bookings.forEach((booking) => {
    if (counts[booking.status] !== undefined) {
      counts[booking.status] += 1
    }
  })
  return counts
}

const sumCounts = (counts: StatusCounts) =>
  Object.values(counts).reduce((sum, value) => sum + value, 0)

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null)
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
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([])
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
          description: 'Votre email a été vérifié avec succès. Bienvenue sur Sendbox !',
          duration: 5000,
        })
        // Supprimer le paramètre de l'URL
        window.history.replaceState({}, '', '/dashboard')
      }
    }

    // Charger le statut KYC
    const loadKycStatus = async () => {
      if (profile) {
        setKycStatus((profile as any).kyc_status as KYCStatus)
        setKycRejectionReason((profile as any).kyc_rejection_reason || null)
      }
    }

    loadKycStatus()
  }, [user?.id, profile])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        return
      }

      setIsLoadingStats(true)
      const supabase = createClient()

      try {
        const [announcementsResult, unreadResult, bookingsResult, notificationsResult] =
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
              .select('id, status, sender_id, traveler_id, total_price, commission_amount, insurance_premium, delivery_confirmed_at, paid_at')
              .or(`sender_id.eq.${user.id},traveler_id.eq.${user.id}`),
            supabase
              .from('notifications')
              .select('id, title, content, created_at, booking_id, link')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(3),
          ])

        const bookings = (bookingsResult.data as BookingRow[]) || []
        const sentBookings = bookings.filter((booking) => booking.sender_id === user.id)
        const receivedBookings = bookings.filter((booking) => booking.traveler_id === user.id)
        const travelerFinancials = calculateTravelerFinancials(receivedBookings as Booking[])
        const requesterFinancials = calculateRequesterFinancials(sentBookings as Booking[])
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

        setRecentNotifications((notificationsResult.data as RecentNotification[]) || [])
      } catch (error) {
        console.error('Dashboard data load error:', error)
        toast.error('Erreur lors du chargement des statistiques')
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  const sentAcceptedTotal =
    stats.sentStatus.accepted +
    stats.sentStatus.paid +
    stats.sentStatus.deposited +
    stats.sentStatus.in_transit +
    stats.sentStatus.delivered
  const receivedAcceptedTotal =
    stats.receivedStatus.accepted +
    stats.receivedStatus.paid +
    stats.receivedStatus.deposited +
    stats.receivedStatus.in_transit +
    stats.receivedStatus.delivered
  const showTravelerSummary = stats.hasTravelerBookings
  const showRequesterSummary = stats.hasRequesterBookings
  const summaryColumns = showTravelerSummary && showRequesterSummary ? 'md:grid-cols-2' : 'md:grid-cols-1'

  // Configuration des charts pour EvilCharts
  const sentRequestChartData = [
    { status: 'En attente', value: stats.sentStatus.pending, fill: 'var(--chart-1)' },
    { status: 'Acceptées', value: sentAcceptedTotal, fill: 'var(--chart-2)' },
    { status: 'Annulées', value: stats.sentStatus.cancelled, fill: 'var(--chart-5)' },
  ]

  const sentRequestChartConfig = {
    value: { label: 'Demandes' },
    pending: { label: 'En attente', color: 'var(--chart-1)' },
    accepted: { label: 'Acceptées', color: 'var(--chart-2)' },
    cancelled: { label: 'Annulées', color: 'var(--chart-5)' },
  } satisfies ChartConfig

  const receivedRequestChartData = [
    { status: 'En attente', value: stats.receivedStatus.pending, fill: 'var(--chart-1)' },
    { status: 'Acceptées', value: receivedAcceptedTotal, fill: 'var(--chart-2)' },
    { status: 'Annulées', value: stats.receivedStatus.cancelled, fill: 'var(--chart-5)' },
  ]

  const receivedRequestChartConfig = {
    value: { label: 'Demandes' },
    pending: { label: 'En attente', color: 'var(--chart-1)' },
    accepted: { label: 'Acceptées', color: 'var(--chart-2)' },
    cancelled: { label: 'Annulées', color: 'var(--chart-5)' },
  } satisfies ChartConfig

  const packagesChartData = [
    { status: 'À payer', value: stats.packagesStatus.accepted, fill: 'var(--chart-1)' },
    { status: 'Envoyés', value: stats.packagesStatus.paid + stats.packagesStatus.deposited, fill: 'var(--chart-2)' },
    { status: 'En transit', value: stats.packagesStatus.in_transit, fill: 'var(--chart-3)' },
    { status: 'Livrés', value: stats.packagesStatus.delivered, fill: 'var(--chart-4)' },
    { status: 'Annulés', value: stats.packagesStatus.cancelled, fill: 'var(--chart-5)' },
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
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Tableau de bord' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isFeatureEnabled('KYC_ENABLED') && kycStatus === 'approved' && (
              <Badge
                variant="outline"
                className="border-emerald-600 text-emerald-600"
              >
                <IconCheck className="mr-1 h-3.5 w-3.5" />
                Identité vérifiée
              </Badge>
            )}
            <Button asChild>
              <Link href="/dashboard/annonces/new">
                <IconPackage className="mr-2 h-4 w-4" />
                Nouvelle annonce
              </Link>
            </Button>
          </div>
        }
      />

      {/* Alert Banner KYC - SEULEMENT si feature activée */}
      {isFeatureEnabled('KYC_ENABLED') && (
        <KYCAlertBanner kycStatus={kycStatus} rejectionReason={kycRejectionReason} />
      )}

      {isFeatureEnabled('KYC_ENABLED') && kycStatus !== 'approved' && (
        <Card className="border-blue-500/40 bg-blue-50/60">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <IconShield className="h-5 w-5 text-blue-600" />
                Vérification d'identité requise
              </CardTitle>
              <CardDescription className="text-blue-900/80">
                Finalisez votre vérification pour débloquer toutes les actions sensibles.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/reglages/kyc">Vérifier mon identité</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Publier un trajet',
                'Accepter un colis',
                'Effectuer un paiement',
                'Envoyer / recevoir un colis',
                'Activer une assurance',
              ].map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="bg-white/80 text-blue-900 border border-blue-200/60"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="flex flex-wrap gap-4">
        {/* Card KYC Status - SEULEMENT si feature activée */}
        {isFeatureEnabled('KYC_ENABLED') && (
          <Card className="flex-1 min-w-[200px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vérification d'identité
              </CardTitle>
              <IconShield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kycStatus === 'approved' && (
                <div className="flex items-center gap-2 text-green-600">
                  <IconCheck className="h-5 w-5" />
                  <span className="font-medium text-sm">Compte vérifié</span>
                </div>
              )}
              {kycStatus === 'pending' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <IconClock className="h-5 w-5" />
                    <span className="font-medium text-sm">En cours</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    24-48h
                  </p>
                </div>
              )}
              {(!kycStatus || kycStatus === 'rejected') && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Vérifiez votre identité
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href="/dashboard/reglages/kyc">
                      Commencer →
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Annonces actives
            </CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '—' : stats.activeAnnouncements}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeAnnouncements > 1 ? 'annonces publiées' : 'annonce publiée'}
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
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
            <CardTitle className="text-sm font-medium">
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
          {showTravelerSummary && <FinancialSummaryCard userId={user.id} role="traveler" />}
          {showRequesterSummary && <FinancialSummaryCard userId={user.id} role="requester" />}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[300px] rounded-xl border border-border/60 bg-card/40 shadow-none">
          <CardHeader className="p-5 pb-3 space-y-1">
            <CardTitle className="text-sm font-semibold">Demandes envoyées</CardTitle>
            <CardDescription className="text-xs">
              Demandes créées sur les annonces
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total</span>
              <span className="font-semibold text-foreground">
                {isLoadingStats ? '—' : sumCounts(stats.sentStatus)}
              </span>
            </div>
            <ChartContainer config={sentRequestChartConfig} className="h-[200px] w-full">
              <BarChart accessibilityLayer data={sentRequestChartData}>
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
            <CardTitle className="text-sm font-semibold">Demandes reçues</CardTitle>
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
            <ChartContainer config={receivedRequestChartConfig} className="h-[200px] w-full">
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
            <CardTitle className="text-sm font-semibold">Colis</CardTitle>
            <CardDescription className="text-xs">
              Suivi après acceptation et paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total suivis</span>
              <span className="font-semibold text-foreground">
                {isLoadingStats ? '—' : packagesChartData.reduce((sum, item) => sum + item.value, 0)}
              </span>
            </div>
            <ChartContainer config={packagesChartConfig} className="h-[200px] w-full">
              <BarChart accessibilityLayer data={packagesChartData} layout="horizontal">
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Vos dernières interactions sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="text-sm text-muted-foreground">Chargement des activités...</div>
          ) : recentNotifications.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aucune activité récente pour le moment.
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.created_at
                        ? formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })
                        : 'À l’instant'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!(notification.link || notification.booking_id)}
                    asChild={!!(notification.link || notification.booking_id)}
                  >
                    {notification.link || notification.booking_id ? (
                      <Link href={notification.link || `/dashboard/colis/${notification.booking_id}`}>
                        Voir
                      </Link>
                    ) : (
                      <span>Voir</span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
