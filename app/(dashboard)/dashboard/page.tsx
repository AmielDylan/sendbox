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
import { IconPackage, IconMessage, IconTrendingUp, IconShield, IconCheck, IconClock } from '@tabler/icons-react'
import { KYCAlertBanner } from '@/components/features/kyc/KYCAlertBanner'
import { isFeatureEnabled } from "@/lib/shared/config/features"
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { KYCStatus } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type DashboardStats = {
  activeAnnouncements: number
  unreadMessages: number
  shipmentsCount: number
  revenueTotal: number
}

type RecentNotification = {
  id: string
  title: string
  content: string
  created_at: string | null
  booking_id: string | null
  link: string | null
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    activeAnnouncements: 0,
    unreadMessages: 0,
    shipmentsCount: 0,
    revenueTotal: 0,
  })
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  useEffect(() => {
    // Gérer l'alert de vérification email
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('verified') === 'true') {
        toast.success('Compte vérifié avec succès!', {
          description: 'Vous pouvez maintenant utiliser toutes les fonctionnalités'
        })
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
        const [announcementsResult, unreadResult, shipmentsResult, transactionsResult, notificationsResult] =
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
              .select('id', { count: 'exact', head: true })
              .eq('sender_id', user.id),
            supabase
              .from('transactions')
              .select('amount, type')
              .eq('user_id', user.id)
              .in('type', ['payment', 'payout']),
            supabase
              .from('notifications')
              .select('id, title, content, created_at, booking_id, link')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(3),
          ])

        const revenueTotal = (transactionsResult.data || []).reduce(
          (sum, transaction) => sum + (transaction.amount || 0),
          0
        )

        setStats({
          activeAnnouncements: announcementsResult.count || 0,
          unreadMessages: unreadResult.count || 0,
          shipmentsCount: shipmentsResult.count || 0,
          revenueTotal,
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
          <Button asChild>
            <Link href="/dashboard/annonces/new">
              <IconPackage className="mr-2 h-4 w-4" />
              Nouvelle annonce
            </Link>
          </Button>
        }
      />

      {/* Alert Banner KYC - SEULEMENT si feature activée */}
      {isFeatureEnabled('KYC_ENABLED') && (
        <KYCAlertBanner kycStatus={kycStatus} rejectionReason={kycRejectionReason} />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card KYC Status - SEULEMENT si feature activée */}
        {isFeatureEnabled('KYC_ENABLED') && (
          <Card>
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

        <Card>
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

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colis envoyés</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '—' : stats.shipmentsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.shipmentsCount > 1 ? 'réservations créées' : 'réservation créée'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '—' : `€${stats.revenueTotal.toFixed(0)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              total des transactions
            </p>
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
